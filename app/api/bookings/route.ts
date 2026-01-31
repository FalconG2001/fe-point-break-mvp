import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  CONSOLES,
  TV_COUNT,
  type ConsoleId,
  isDateAllowed,
} from "@/lib/config";
import { CreateBookingSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { date, slot, selections, name, phone } = parsed.data;

  if (!isDateAllowed(date)) {
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

  const db = await getDb();
  const existing = await db
    .collection("bookings")
    .find({ date, slot })
    .project({ _id: 0, selections: 1 })
    .toArray();

  const booked = new Set<ConsoleId>();
  for (const b of existing) {
    for (const s of b.selections ?? []) {
      if (s?.consoleId) booked.add(s.consoleId as ConsoleId);
    }
  }

  // Rule 1: no double-booking the same console
  for (const id of requestedConsoleIds) {
    if (booked.has(id)) {
      return NextResponse.json(
        { error: `Console already booked for ${slot}`, consoleId: id },
        { status: 409 },
      );
    }
  }

  // Rule 2: TV capacity (max 3 consoles at once)
  const totalAfter = booked.size + requestedConsoleIds.length;
  if (totalAfter > TV_COUNT) {
    return NextResponse.json(
      {
        error: "No TV capacity left for this slot",
        tvCapacity: TV_COUNT,
        alreadyBookedCount: booked.size,
      },
      { status: 409 },
    );
  }

  // Basic sanity: console must exist
  const all = new Set(CONSOLES.map((c) => c.id));
  for (const id of requestedConsoleIds) {
    if (!all.has(id)) {
      return NextResponse.json({ error: "Unknown console" }, { status: 400 });
    }
  }

  const doc = {
    date,
    slot,
    selections,
    customer: { name, phone },
    createdAt: new Date().toISOString(),
  };

  const res = await db.collection("bookings").insertOne(doc);

  return NextResponse.json({ ok: true, id: String(res.insertedId) });
}
