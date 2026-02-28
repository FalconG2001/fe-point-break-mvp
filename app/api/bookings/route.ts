import { NextResponse } from "next/server";
import { sendBookingNotification } from "@/lib/whatsapp-notify";
import { connectToDB } from "@/lib/mongodb";
import Booking from "@/models/booking";
import { isAdminAllowed } from "@/lib/mongodb";
import {
  CONSOLES,
  TV_COUNT,
  type ConsoleId,
  isDateAllowed,
  isSlotPast,
  getSlotsForDuration,
} from "@/lib/config";
import { CreateBookingSchema, UpdateBookingSchema } from "@/lib/validators";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const adminAllowed = email ? await isAdminAllowed(email) : false;

  const body = await req.json().catch(() => null);
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // ✅ override client input
  const bookingFrom = adminAllowed ? "admin" : "website";

  // ✅ ignore money fields for public users
  const payments = adminAllowed ? parsed.data.payments || [] : [];
  const totalPrice = adminAllowed ? parsed.data.totalPrice || 0 : 0;

  const { date, slot, selections, name, phone } = parsed.data;

  const isAdmin = bookingFrom === "admin";
  if (!isAdmin && !isDateAllowed(date)) {
    return NextResponse.json({ error: "Date not allowed" }, { status: 400 });
  }
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

  await connectToDB();

  // Get all confirmed bookings for this date
  const existingBookings = await Booking.find({
    date,
    confirmed: { $ne: false },
  })
    .select("slot selections")
    .lean();

  // Build a map: slot -> Set of console IDs already booked
  const bookedBySlot = new Map<string, Set<ConsoleId>>();
  for (const b of existingBookings) {
    const startSlot: string = (b as any).slot;
    const sel = Array.isArray(b.selections) ? (b.selections as any[]) : [];
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

      // Rule 2: TV capacity (max TV_COUNT consoles at once)
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

  try {
    const booking = new Booking({
      date,
      slot,
      selections,
      customer: { name, phone },
      confirmed: true,
      bookingFrom,
      payments: payments || [],
      totalPrice: totalPrice || 0,
    });

    const res = await booking.save();

    // Fire-and-forget WhatsApp notification to admin
    sendBookingNotification({
      bookingId: String(res._id),
      date,
      slot,
      selections,
      customerName: name,
      customerPhone: phone || "",
      bookingFrom,
      totalPrice,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: String(res._id) });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save booking" },
      { status: 400 },
    );
  }
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

  const {
    id,
    date,
    slot,
    selections,
    name,
    phone,
    bookingFrom,
    payments,
    totalPrice,
  } = parsed.data;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }
  const objectId = new mongoose.Types.ObjectId(id);

  const isAdmin = bookingFrom === "admin";
  if (!isAdmin && !isDateAllowed(date)) {
    return NextResponse.json({ error: "Date not allowed" }, { status: 400 });
  }

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

  await connectToDB();

  // Get all confirmed bookings for this date, EXCLUDING current booking
  const existingBookings = await Booking.find({
    date,
    confirmed: { $ne: false },
    _id: { $ne: objectId },
  })
    .select("slot selections")
    .lean();

  const bookedBySlot = new Map<string, Set<ConsoleId>>();
  for (const b of existingBookings) {
    const startSlot: string = (b as any).slot;
    const sel = Array.isArray(b.selections) ? (b.selections as any[]) : [];
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
    date,
    slot,
    selections,
    customer: { name, phone },
    bookingFrom,
    payments: payments || [],
    totalPrice: totalPrice !== undefined ? totalPrice : undefined,
  };

  try {
    const result = await Booking.updateOne(
      { _id: objectId },
      { $set: update },
      { runValidators: true },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update booking" },
      { status: 400 },
    );
  }
}
