import { CONSOLES } from "./config";

export type SelectionWithDuration = {
  consoleId: string;
  players: number;
  duration: number;
  durationLabel: string;
  endTime: string;
};

export type AdminBooking = {
  id: string;
  date: string;
  slot: string;
  selections: SelectionWithDuration[];
  customer: { name: string; phone: string };
  confirmed: boolean;
  createdAt: string;
  bookingFrom?: "website" | "whatsapp" | "admin";
  payments?: Array<{ type: number; amount: number }>;
  totalPrice?: number;
};

export type ApiResp = {
  date: string;
  totalBookings: number;
  totalConsolesBooked: number;
  totalPlayers: number;
  grandTotalPaid: number;
  grandTotalDue: number;
  lastSlotEnding: string;
  bookings: AdminBooking[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
};

export const consoleName = (id: string) =>
  CONSOLES.find((c) => c.id === id)?.short ?? id;
