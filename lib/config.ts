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
export const SLOT_LENGTH_MINUTES = 60;
export const OPEN_HOUR = 10; // 10:00
export const CLOSE_HOUR = 22; // 22:00 (last slot starts at 21:00)

// Player rules (feel free to change)
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;

export function buildSlots(): string[] {
  // returns "10:00", "11:00", ... "21:00"
  const slots: string[] = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h += 1) {
    const hh = String(h).padStart(2, "0");
    slots.push(`${hh}:00`);
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
