import { z } from "zod";
import {
  CONSOLES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  SLOTS,
  DURATION_OPTIONS,
  isDateAllowed,
} from "./config";

export const ConsoleIdSchema = z.enum(
  CONSOLES.map((c) => c.id) as [string, ...string[]],
);

export const DurationSchema = z
  .enum(DURATION_OPTIONS.map(String) as [string, ...string[]])
  .transform(Number);

export const BookingSelectionSchema = z.object({
  consoleId: ConsoleIdSchema,
  players: z.number().int().min(MIN_PLAYERS).max(MAX_PLAYERS),
  duration: z
    .number()
    .refine((v) => DURATION_OPTIONS.includes(v as any), "Invalid duration"),
});

// Booking source tracking
export const BOOKING_SOURCES = ["website", "whatsapp", "admin"] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];
export const BookingSourceSchema = z.enum(BOOKING_SOURCES);

export const CreateBookingSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => isDateAllowed(v), "Date must be today or within 2 days."),
  slot: z.enum(SLOTS as [string, ...string[]]),
  selections: z
    .array(BookingSelectionSchema)
    .min(1, "Pick at least one console."),
  name: z.string().min(2).max(60),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[0-9+()\-\s]+$/, "Phone looks invalid."),
  bookingFrom: BookingSourceSchema.optional().default("website"),
});
