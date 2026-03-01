import { Schema, Document, models, model } from "mongoose";
import {
  CONSOLES,
  DURATION_OPTIONS,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from "@/lib/config";

const consoleIds = CONSOLES.map((c) => c.id);

export interface IBookingSelection {
  consoleId: string;
  players: number;
  duration: number;
}

export interface IPayment {
  type: number; // 1: GPay, 2: Cash
  amount: number;
}

export interface IBooking extends Document {
  date: string;
  slot: string;
  selections: IBookingSelection[];
  customer: {
    name: string;
    phone?: string;
  };
  confirmed: boolean;
  bookingFrom: "website" | "whatsapp" | "admin";
  payments: IPayment[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const SelectionSchema = new Schema<IBookingSelection>(
  {
    consoleId: {
      type: String,
      required: true,
      enum: consoleIds,
    },
    players: {
      type: Number,
      required: true,
      min: MIN_PLAYERS,
      max: MAX_PLAYERS,
    },
    duration: {
      type: Number,
      required: true,
      enum: DURATION_OPTIONS,
    },
  },
  { _id: false },
);

const PaymentSchema = new Schema<IPayment>(
  {
    type: {
      type: Number,
      required: true,
      enum: [1, 2],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const BookingSchema = new Schema<IBooking>(
  {
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    slot: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
    },
    selections: {
      type: [SelectionSchema],
      validate: [
        (v: any) => Array.isArray(v) && v.length > 0,
        "At least one selection required",
      ],
    },
    customer: {
      name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 60,
      },
      phone: {
        type: String,
        match: /^[0-9+()\-\s]*$/,
      },
    },
    confirmed: {
      type: Boolean,
      default: true,
    },
    bookingFrom: {
      type: String,
      required: true,
      enum: ["website", "whatsapp", "admin"],
      default: "website",
    },
    payments: {
      type: [PaymentSchema],
      default: [],
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for common queries
BookingSchema.index({ date: 1, confirmed: 1 });
BookingSchema.index({ "customer.name": "text" });

export default models.Booking || model<IBooking>("Booking", BookingSchema);
