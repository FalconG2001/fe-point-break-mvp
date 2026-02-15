import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  CONSOLES,
  TV_COUNT,
  type ConsoleId,
  isDateAllowed,
  isSlotPast,
  getSlotsForDuration,
} from "@/lib/config";
import { CreateBookingSchema, UpdateBookingSchema } from "@/lib/validators";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminAllowed } from "@/lib/mongodb";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { date, slot, selections, name, phone, bookingFrom } = parsed.data;

  if (!isDateAllowed(date)) {
    return NextResponse.json({ error: "Date not allowed" }, { status: 400 });
  }

  // Prevent booking past slots for today (unless admin)
  const isAdmin = bookingFrom === "admin";
  if (!isAdmin && isSlotPast(date, slot)) {
    return NextResponse.json(
      { error: "This time slot has already passed" },
      { status: 400 },
    );
  }

  const requestedConsoleIds = selections.map((s) => s.consoleId as ConsoleId);
  const uniqueRequested = new Set(requestedConsoleIds);
  if (uniqueRequested.size !== requestedConsoleIds.length) {
    return NextResponse.json(
      { error: "Duplicate console selected" },
      { status: 400 },
    );
  }

  // Basic sanity: console must exist
  const allConsoles = new Set(CONSOLES.map((c) => c.id));
  for (const id of requestedConsoleIds) {
    if (!allConsoles.has(id)) {
      return NextResponse.json({ error: "Unknown console" }, { status: 400 });
    }
  }

  // Check that booking doesn't exceed slot boundaries
  for (const sel of selections) {
    const coveredSlots = getSlotsForDuration(slot, sel.duration);
    if (coveredSlots.length === 0) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }
    // Check if duration extends beyond closing time
    const expectedSlotCount = Math.ceil(sel.duration / 15);
    if (coveredSlots.length < expectedSlotCount) {
      return NextResponse.json(
        { error: `Duration extends beyond closing time for ${sel.consoleId}` },
        { status: 400 },
      );
    }
    // Check if any covered slot is in the past (unless admin)
    for (const coveredSlot of coveredSlots) {
      if (!isAdmin && isSlotPast(date, coveredSlot)) {
        return NextResponse.json(
          { error: `Time slot ${coveredSlot} has already passed` },
          { status: 400 },
        );
      }
    }
  }

  const db = await getDb();

  // Get all confirmed bookings for this date
  const existingBookings = await db
    .collection("bookings")
    .find({ date, confirmed: { $ne: false } })
    .project({ _id: 0, slot: 1, selections: 1 })
    .toArray();

  // Build a map: slot -> Set of console IDs already booked
  const bookedBySlot = new Map<string, Set<ConsoleId>>();
  for (const b of existingBookings) {
    const startSlot: string = b.slot;
    const sel = Array.isArray(b.selections) ? b.selections : [];
    for (const s of sel) {
      if (!s?.consoleId) continue;
      const consoleId = s.consoleId as ConsoleId;
      const duration = s.duration || 60;
      const coveredSlots = getSlotsForDuration(startSlot, duration);
      for (const coveredSlot of coveredSlots) {
        const set = bookedBySlot.get(coveredSlot) ?? new Set<ConsoleId>();
        set.add(consoleId);
        bookedBySlot.set(coveredSlot, set);
      }
    }
  }

  // Check conflicts for each requested console
  for (const sel of selections) {
    const consoleId = sel.consoleId as ConsoleId;
    const coveredSlots = getSlotsForDuration(slot, sel.duration);

    for (const coveredSlot of coveredSlots) {
      const bookedInSlot =
        bookedBySlot.get(coveredSlot) ?? new Set<ConsoleId>();

      // Rule 1: no double-booking the same console
      if (bookedInSlot.has(consoleId)) {
        return NextResponse.json(
          {
            error: `${consoleId} is already booked for ${coveredSlot}`,
            consoleId,
            conflictSlot: coveredSlot,
          },
          { status: 409 },
        );
      }

      // Rule 2: TV capacity (max 3 consoles at once)
      // Count how many consoles would be active in this slot after adding new ones
      const currentCount = bookedInSlot.size;
      // Count how many of the requested consoles affect this slot
      const newConsolesInSlot = selections.filter((s) => {
        const slots = getSlotsForDuration(slot, s.duration);
        return slots.includes(coveredSlot);
      }).length;
      const totalAfter = currentCount + newConsolesInSlot;

      if (totalAfter > TV_COUNT) {
        return NextResponse.json(
          {
            error: `No TV capacity left for slot ${coveredSlot}`,
            tvCapacity: TV_COUNT,
            alreadyBookedCount: currentCount,
          },
          { status: 409 },
        );
      }
    }
  }

  const doc = {
    date,
    slot,
    selections,
    customer: { name, phone },
    confirmed: true, // New bookings are confirmed by default
    bookingFrom,
    createdAt: new Date().toISOString(),
  };

  const res = await db.collection("bookings").insertOne(doc);

  return NextResponse.json({ ok: true, id: String(res.insertedId) });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const allowed = await isAdminAllowed(email);
  if (!allowed) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id, date, slot, selections, name, phone, bookingFrom } = parsed.data;

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }

  if (!isDateAllowed(date)) {
    return NextResponse.json({ error: "Date not allowed" }, { status: 400 });
  }

  // Admin check for past slot is already handled in validator (CreateBookingSchema superRefine)
  // but we should still be careful here if we ever change validator.

  const requestedConsoleIds = selections.map((s) => s.consoleId as ConsoleId);
  const uniqueRequested = new Set(requestedConsoleIds);
  if (uniqueRequested.size !== requestedConsoleIds.length) {
    return NextResponse.json(
      { error: "Duplicate console selected" },
      { status: 400 },
    );
  }

  const allConsoles = new Set(CONSOLES.map((c) => c.id));
  for (const cid of requestedConsoleIds) {
    if (!allConsoles.has(cid)) {
      return NextResponse.json({ error: "Unknown console" }, { status: 400 });
    }
  }

  for (const sel of selections) {
    const coveredSlots = getSlotsForDuration(slot, sel.duration);
    if (coveredSlots.length === 0) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }
    const expectedSlotCount = Math.ceil(sel.duration / 15);
    if (coveredSlots.length < expectedSlotCount) {
      return NextResponse.json(
        { error: `Duration extends beyond closing time for ${sel.consoleId}` },
        { status: 400 },
      );
    }
  }

  const db = await getDb();

  // Get all confirmed bookings for this date, EXCLUDING current booking
  const existingBookings = await db
    .collection("bookings")
    .find({
      date,
      confirmed: { $ne: false },
      _id: { $ne: objectId },
    })
    .project({ _id: 0, slot: 1, selections: 1 })
    .toArray();

  const bookedBySlot = new Map<string, Set<ConsoleId>>();
  for (const b of existingBookings) {
    const startSlot: string = b.slot;
    const sel = Array.isArray(b.selections) ? b.selections : [];
    for (const s of sel) {
      if (!s?.consoleId) continue;
      const consoleId = s.consoleId as ConsoleId;
      const duration = s.duration || 60;
      const coveredSlots = getSlotsForDuration(startSlot, duration);
      for (const coveredSlot of coveredSlots) {
        const set = bookedBySlot.get(coveredSlot) ?? new Set<ConsoleId>();
        set.add(consoleId);
        bookedBySlot.set(coveredSlot, set);
      }
    }
  }

  for (const sel of selections) {
    const consoleId = sel.consoleId as ConsoleId;
    const coveredSlots = getSlotsForDuration(slot, sel.duration);

    for (const coveredSlot of coveredSlots) {
      const bookedInSlot =
        bookedBySlot.get(coveredSlot) ?? new Set<ConsoleId>();

      if (bookedInSlot.has(consoleId)) {
        return NextResponse.json(
          {
            error: `${consoleId} is already booked for ${coveredSlot}`,
            consoleId,
            conflictSlot: coveredSlot,
          },
          { status: 409 },
        );
      }

      const currentCount = bookedInSlot.size;
      const newConsolesInSlot = selections.filter((s) => {
        const slots = getSlotsForDuration(slot, s.duration);
        return slots.includes(coveredSlot);
      }).length;
      const totalAfter = currentCount + newConsolesInSlot;

      if (totalAfter > TV_COUNT) {
        return NextResponse.json(
          {
            error: `No TV capacity left for slot ${coveredSlot}`,
            tvCapacity: TV_COUNT,
            alreadyBookedCount: currentCount,
          },
          { status: 409 },
        );
      }
    }
  }

  const update = {
    $set: {
      date,
      slot,
      selections,
      customer: { name, phone },
      bookingFrom,
      updatedAt: new Date().toISOString(),
    },
  };

  const result = await db
    .collection("bookings")
    .updateOne({ _id: objectId }, update);

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
