import type { ConsoleId } from "@/lib/config";

export type BookingSelection = {
  consoleId: ConsoleId;
  players: number;
};

export type BookingDoc = {
  _id?: string;
  date: string; // YYYY-MM-DD
  slot: string; // e.g. "18:00"
  selections: BookingSelection[];
  customer: { name: string; phone: string };
  createdAt: string;
};

export type AvailabilitySlot = {
  slot: string;
  bookedConsoleIds: ConsoleId[];
  availableConsoleIds: ConsoleId[];
  tvCapacityRemaining: number;
};
