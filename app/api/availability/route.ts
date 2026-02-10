import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  CONSOLES,
  TV_COUNT,
  type ConsoleId,
  isDateAllowed,
  isSlotPast,
  getSlotsForDuration,
  getStartSlotsForDate,
} from "@/lib/config";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || "";
  if (!isDateAllowed(date)) {
    return NextResponse.json({ error: "Date not allowed" }, { status: 400 });
  }

  const db = await getDb();
  // Only fetch confirmed bookings (not cancelled)
  const bookings = await db
    .collection("bookings")
    .find({ date, confirmed: { $ne: false } })
    .project({ _id: 0, slot: 1, selections: 1 })
    .toArray();

  // Build a map: slot -> Set of console IDs booked for that slot
  // Each booking may cover multiple slots based on duration
  const bySlot = new Map<string, Set<ConsoleId>>();

  for (const b of bookings) {
    const startSlot: string = b.slot;
    const sel = Array.isArray(b.selections) ? b.selections : [];

    for (const s of sel) {
      if (!s?.consoleId) continue;
      const consoleId = s.consoleId as ConsoleId;
      const duration = s.duration || 60; // Default 60 min for legacy bookings

      // Get all slots this console occupies
      const coveredSlots = getSlotsForDuration(startSlot, duration);
      for (const coveredSlot of coveredSlots) {
        const set = bySlot.get(coveredSlot) ?? new Set<ConsoleId>();
        set.add(consoleId);
        bySlot.set(coveredSlot, set);
      }
    }
  }

  const allIds = CONSOLES.map((c) => c.id);
  const duration = Number(url.searchParams.get("duration") || "60") || 60;

  const startSlots = getStartSlotsForDate(date, duration);

  const slots = startSlots.map((startSlot) => {
    const isPast = isSlotPast(date, startSlot);

    const covered = getSlotsForDuration(startSlot, duration);
    const bookedSet = new Set<ConsoleId>();

    for (const t of covered) {
      for (const cid of bySlot.get(t) ?? []) bookedSet.add(cid);
    }

    const booked = Array.from(bookedSet);
    const tvRemaining = isPast ? 0 : Math.max(0, TV_COUNT - booked.length);

    const available =
      tvRemaining <= 0
        ? []
        : (allIds.filter((id) => !bookedSet.has(id)) as ConsoleId[]);

    return {
      slot: startSlot,
      bookedConsoleIds: booked,
      availableConsoleIds: available,
      tvCapacityRemaining: tvRemaining,
      isPast,
    };
  });

  return NextResponse.json({ date, slots });
}
