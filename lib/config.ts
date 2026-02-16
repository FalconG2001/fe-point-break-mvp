export type ConsoleId = "xbox-series-x" | "xbox-one-s" | "ps5" | "xbox-360";

export const SLOT_LENGTH_MINUTES = 15;

const WEEKDAY_OPEN = 11 * 60; // 11:00
const WEEKDAY_BREAK_START = 17 * 60 + 30; // 17:30
const WEEKDAY_BREAK_END = 19 * 60; // 19:00
const WEEKDAY_CLOSE = 21 * 60; // 21:00

const SUNDAY_OPEN = 10 * 60; // 10:00
const SUNDAY_CLOSE = 18 * 60 + 30; // 18:30

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
export const OPEN_HOUR = 10; // 10:00
export const CLOSE_HOUR = 22; // 22:00 (last slot starts at 21:45)

// Player rules (feel free to change)
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;

// Duration options (in minutes)
export const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180] as const;
export type DurationMinutes = (typeof DURATION_OPTIONS)[number];

export const DURATION_LABELS: Record<DurationMinutes, string> = {
  30: "30 mins",
  60: "1 hour",
  90: "1.5 hours",
  120: "2 hours",
  150: "2.5 hours",
  180: "3 hours",
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dayOfWeekFromYmd(ymd: string): number {
  const [y, mo, d] = ymd.split("-").map(Number);
  return new Date(y, mo - 1, d).getDay(); // 0=Sun ... 6=Sat
}

/**
 * Start times you allow for a given date + duration.
 * Ensures the session ends before closing and doesn't cross break.
 */
export function getStartSlotsForDate(
  ymd: string,
  durationMinutes: number,
): string[] {
  const dow = dayOfWeekFromYmd(ymd);

  const makeRange = (startMin: number, endMin: number) => {
    const lastStart = endMin - durationMinutes;
    const out: string[] = [];
    for (let t = startMin; t <= lastStart; t += SLOT_LENGTH_MINUTES) {
      out.push(minutesToTime(t));
    }
    return out;
  };

  // Sunday
  if (dow === 0) {
    return makeRange(SUNDAY_OPEN, SUNDAY_CLOSE); // last start will be 17:30 for 60 mins
  }

  // Mon-Sat (two segments)
  return [
    ...makeRange(WEEKDAY_OPEN, WEEKDAY_BREAK_START), // last start becomes 16:30 for 60 mins
    ...makeRange(WEEKDAY_BREAK_END, WEEKDAY_CLOSE), // last start becomes 20:00 for 60 mins
  ];
}

export function isStartSlotAllowed(
  ymd: string,
  slot: string,
  durationMinutes: number,
): boolean {
  const allowed = getStartSlotsForDate(ymd, durationMinutes);
  return allowed.includes(slot);
}

/**
 * Covered 15-min blocks for a booking starting at HH:MM
 * If start time is not on a 15-min boundary, we include the 15-min block it falls into.
 * Example: 10:07 for 60 mins covers 10:00, 10:15, 10:30, 10:45, 11:00.
 */
export function getSlotsForDuration(
  startSlot: string,
  durationMinutes: number,
): string[] {
  const startTotalMinutes = timeToMinutes(startSlot);
  const endTotalMinutes = startTotalMinutes + durationMinutes;

  // Find the first 15-min boundary <= startTotalMinutes
  const firstSlotMinutes =
    Math.floor(startTotalMinutes / SLOT_LENGTH_MINUTES) * SLOT_LENGTH_MINUTES;

  const slots: string[] = [];
  for (
    let t = firstSlotMinutes;
    t < endTotalMinutes;
    t += SLOT_LENGTH_MINUTES
  ) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

/**
 * Calculate how many 15-min slots a duration occupies
 */
export function durationToSlotCount(durationMinutes: number): number {
  return Math.ceil(durationMinutes / SLOT_LENGTH_MINUTES);
}

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

// India timezone for all date/time calculations
const INDIA_TIMEZONE = "Asia/Kolkata";

/**
 * Get current date/time parts in India timezone
 */
function getIndiaTime(): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function todayYmd(offsetDays: number = 0): string {
  const india = getIndiaTime();
  const d = new Date(india.year, india.month - 1, india.day);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDateAllowed(ymd: string): boolean {
  const india = getIndiaTime();
  const todayDate = new Date(india.year, india.month - 1, india.day);

  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(y, m - 1, d);

  const diffMs = dt.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 2;
}

/**
 * Check if a slot time has already passed for the given date.
 * Returns true if the slot is in the past (and should be unavailable).
 * Uses India timezone (Asia/Kolkata) for consistent behavior on Vercel.
 */
export function isSlotPast(ymd: string, slot: string): boolean {
  const india = getIndiaTime();
  const todayStr = todayYmd(0);

  // Only check for today's date - future dates are always valid
  if (ymd !== todayStr) return false;

  // Parse slot time (e.g., "18:00" or "18:15")
  const [slotHour, slotMinute] = slot.split(":").map(Number);
  if (isNaN(slotHour) || isNaN(slotMinute)) return false;

  const currentHour = india.hour;
  const currentMinute = india.minute;

  // Slot is past if current time >= slot time
  if (currentHour > slotHour) return true;
  if (currentHour === slotHour && currentMinute >= slotMinute) return true;
  return false;
}
