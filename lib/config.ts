export type ConsoleId = "xbox-series-x" | "xbox-one-s" | "ps5" | "xbox-360";

export const CENTRE_NAME = "Point Break";

export const TV_COUNT = 3;

export const CONSOLES: Array<{
  id: ConsoleId;
  name: string;
  short: string;
  notes: string;
}> = [
  {
    id: "xbox-series-x",
    name: "Xbox Series X",
    short: "Series X",
    notes: "Main station (usually connected).",
  },
  {
    id: "ps5",
    name: "PlayStation 5",
    short: "PS5",
    notes: "Main station (usually connected).",
  },
  {
    id: "xbox-one-s",
    name: "Xbox One S",
    short: "One S",
    notes: "Main station (usually connected).",
  },
  {
    id: "xbox-360",
    name: "Xbox 360",
    short: "360",
    notes: "Backup console (swap-in if needed).",
  },
];

// Slot rules (MVP):
export const SLOT_LENGTH_MINUTES = 15;
export const OPEN_HOUR = 10; // 10:00
export const CLOSE_HOUR = 22; // 22:00 (last slot starts at 21:45)

// Player rules (feel free to change)
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;

export function buildSlots(): string[] {
  // returns "10:00", "10:15", "10:30", "10:45", "11:00", ... "21:45"
  const slots: string[] = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h += 1) {
    for (let m = 0; m < 60; m += SLOT_LENGTH_MINUTES) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
}

export const SLOTS = buildSlots();

export function todayYmd(offsetDays: number = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDateAllowed(ymd: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);

  const diffMs = dt.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 2;
}

/**
 * Check if a slot time has already passed for the given date.
 * Returns true if the slot is in the past (and should be unavailable).
 */
export function isSlotPast(ymd: string, slot: string): boolean {
  const now = new Date();
  const todayStr = todayYmd(0);

  // Only check for today's date - future dates are always valid
  if (ymd !== todayStr) return false;

  // Parse slot time (e.g., "18:00" or "18:15")
  const [slotHour, slotMinute] = slot.split(":").map(Number);
  if (isNaN(slotHour) || isNaN(slotMinute)) return false;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Slot is past if current time >= slot time
  if (currentHour > slotHour) return true;
  if (currentHour === slotHour && currentMinute >= slotMinute) return true;
  return false;
}
