import mongoose, { Schema, Document } from "mongoose";

export type SessionState =
  | "idle"
  | "awaiting_date"
  | "awaiting_slot"
  | "awaiting_console"
  | "awaiting_name"
  | "awaiting_confirm";

export interface IWhatsAppSession extends Document {
  phoneNumber: string;
  state: SessionState;
  data: {
    date?: string;
    slot?: string;
    slotPage?: number;
    consoleId?: string;
    customerName?: string;
    duration?: number;
  };
  updatedAt: Date;
  createdAt: Date;
}

const WhatsAppSessionSchema: Schema = new Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    state: {
      type: String,
      required: true,
      enum: [
        "idle",
        "awaiting_date",
        "awaiting_slot",
        "awaiting_console",
        "awaiting_name",
        "awaiting_confirm",
      ],
      default: "idle",
    },
    data: {
      date: { type: String },
      slot: { type: String },
      slotPage: { type: Number },
      consoleId: { type: String },
      customerName: { type: String },
      duration: { type: Number },
    },
  },
  {
    timestamps: true,
    collection: "whatsapp_sessions",
  },
);

// TTL index to automatically delete sessions after 30 minutes of inactivity
// Note: updatedAt is used for TTL
WhatsAppSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 60 });

const WhatsAppSession =
  mongoose.models.WhatsAppSession ||
  mongoose.model<IWhatsAppSession>("WhatsAppSession", WhatsAppSessionSchema);

export default WhatsAppSession;
