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
    return true;
  }, "Invalid time format");

export const PaymentSchema = z.object({
  type: z
    .number()
    .int()
    .refine((v) => [1, 2].includes(v), "Invalid payment type"), // 1: GPay, 2: Cash
  amount: z.number().min(0),
});

export const CreateBookingSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    slot: SlotSchema,
    selections: z.array(BookingSelectionSchema).min(1),
    name: z.string().min(2).max(60),
    phone: z
      .string()
      .min(0)
      .max(20)
      .regex(/^[0-9+()\-\s]*$/)
      .optional()
      .or(z.literal("")),
    bookingFrom: BookingSourceSchema.optional().default("website"),
    payments: z.array(PaymentSchema).optional(),
    totalPrice: z.number().min(0).optional(),
  })
  .superRefine((val, ctx) => {
    const isAdmin = val.bookingFrom === "admin";

    // Date range check
    if (!isAdmin && !isDateAllowed(val.date)) {
      ctx.addIssue({
        path: ["date"],
        code: z.ZodIssueCode.custom,
        message: "Date not allowed",
      });
    }

    // 15-min step check (only for non-admins)
    if (!isAdmin) {
      const [, m] = val.slot.split(":").map(Number);
      if (m % 15 !== 0) {
        ctx.addIssue({
          path: ["slot"],
          code: z.ZodIssueCode.custom,
          message: "Slot must be in 15-min steps",
        });
      }
    }

    // past slot guard
    if (!isAdmin && isSlotPast(val.date, val.slot)) {
      ctx.addIssue({
        path: ["slot"],
        code: z.ZodIssueCode.custom,
        message: "Slot is in the past.",
      });
    }

    // slot must be allowed for EACH selection duration
    // For admins, we skip the predefined slot list check, but we should still
    // ensure it's within business hours. For now, we trust the Admin UI minTime/maxTime.
    if (!isAdmin) {
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
    }
  });

export const UpdateBookingSchema = CreateBookingSchema.extend({
  id: z.string().min(1),
});
