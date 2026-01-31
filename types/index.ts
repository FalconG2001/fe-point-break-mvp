import type { ConsoleId, DurationMinutes } from "@/lib/config";

export type BookingSelection = {
  consoleId: ConsoleId;
  players: number;
  duration: DurationMinutes; // Duration in minutes for this console
};

export type BookingDoc = {
  _id?: string;
  date: string; // YYYY-MM-DD
  slot: string; // e.g. "18:00" - start slot
  selections: BookingSelection[];
  customer: { name: string; phone: string };
  confirmed: boolean; // true = active, false = cancelled
  createdAt: string;
};

export type AvailabilitySlot = {
  slot: string;
  bookedConsoleIds: ConsoleId[];
  availableConsoleIds: ConsoleId[];
  tvCapacityRemaining: number;
  isPast?: boolean;
};
