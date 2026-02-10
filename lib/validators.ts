import { z } from "zod";
import {
  CONSOLES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  DURATION_OPTIONS,
  isDateAllowed,
  isSlotPast,
  isStartSlotAllowed,
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

const SlotSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Slot must be HH:MM")
  .refine((v) => {
    const [h, m] = v.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
    if (h < 0 || h > 23) return false;
    return m % 15 === 0;
  }, "Slot must be in 15-min steps");

export const CreateBookingSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(isDateAllowed),
    slot: SlotSchema,
    selections: z.array(BookingSelectionSchema).min(1),
    name: z.string().min(2).max(60),
    phone: z
      .string()
      .min(7)
      .max(20)
      .regex(/^[0-9+()\-\s]+$/),
    bookingFrom: BookingSourceSchema.optional().default("website"),
  })
  .superRefine((val, ctx) => {
    // past slot guard
    if (isSlotPast(val.date, val.slot)) {
      ctx.addIssue({
        path: ["slot"],
        code: z.ZodIssueCode.custom,
        message: "Slot is in the past.",
      });
    }

    // slot must be allowed for EACH selection duration
    for (const sel of val.selections) {
      if (!isStartSlotAllowed(val.date, val.slot, sel.duration)) {
        ctx.addIssue({
          path: ["slot"],
          code: "custom",
          message: `Slot not allowed for ${sel.duration} mins on that date.`,
        });
        break;
      }
    }
  });
