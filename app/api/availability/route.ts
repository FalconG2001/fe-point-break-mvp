import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  CONSOLES,
  SLOTS,
  TV_COUNT,
  type ConsoleId,
  isDateAllowed,
} from "@/lib/config";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || "";
  if (!isDateAllowed(date)) {
    return NextResponse.json({ error: "Date not allowed" }, { status: 400 });
  }

  const db = await getDb();
  const bookings = await db
    .collection("bookings")
    .find({ date })
    .project({ _id: 0, slot: 1, selections: 1 })
    .toArray();

  const bySlot = new Map<string, Set<ConsoleId>>();
  const countBySlot = new Map<string, number>();

  for (const b of bookings) {
    const slot: string = b.slot;
    const set = bySlot.get(slot) ?? new Set<ConsoleId>();
    const sel = Array.isArray(b.selections) ? b.selections : [];
    for (const s of sel) {
      if (s?.consoleId) set.add(s.consoleId as ConsoleId);
    }
    bySlot.set(slot, set);
    countBySlot.set(slot, (countBySlot.get(slot) ?? 0) + set.size);
  }

  const allIds = CONSOLES.map((c) => c.id);
  const slots = SLOTS.map((slot) => {
    const booked = Array.from(bySlot.get(slot) ?? new Set<ConsoleId>());
    const bookedCount = booked.length;
    const tvRemaining = Math.max(0, TV_COUNT - bookedCount);

    const available =
      tvRemaining <= 0
        ? []
        : (allIds.filter((id) => !booked.includes(id)) as ConsoleId[]);

    return {
      slot,
      bookedConsoleIds: booked,
      availableConsoleIds: available,
      tvCapacityRemaining: tvRemaining,
    };
  });

  return NextResponse.json({ date, slots });
}
