/**
 * WhatsApp Session Manager
 * Manages conversation state for booking flow
 */

import { connectToDB } from "./mongodb";
import WhatsAppSession, {
  SessionState as ModelSessionState,
} from "@/models/whatsapp-session";

export type SessionState = ModelSessionState;

export interface WhatsAppSession {
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

/**
 * Get or create a session for a phone number
 */
export async function getSession(
  phoneNumber: string,
): Promise<WhatsAppSession> {
  await connectToDB();

  // Find session (Mongoose handles TTL via index on updatedAt)
  const existing = await WhatsAppSession.findOne({ phoneNumber }).lean();

  if (existing) {
    return existing as unknown as WhatsAppSession;
  }

  // Create new session
  const newSessionData = {
    phoneNumber,
    state: "idle",
    data: {},
  };

  const res = await WhatsAppSession.create(newSessionData);
  return res.toObject() as unknown as WhatsAppSession;
}

/**
 * Update session state and data
 */
export async function updateSession(
  phoneNumber: string,
  state: SessionState,
  data: Partial<WhatsAppSession["data"]> = {},
): Promise<void> {
  await connectToDB();
  await WhatsAppSession.updateOne(
    { phoneNumber },
    {
      $set: {
        state,
        data,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

/**
 * Clear/reset a session
 */
export async function clearSession(phoneNumber: string): Promise<void> {
  await connectToDB();
  await WhatsAppSession.deleteOne({ phoneNumber });
}

/**
 * Add data to existing session without replacing
 */
export async function mergeSessionData(
  phoneNumber: string,
  newData: Partial<WhatsAppSession["data"]>,
): Promise<void> {
  await connectToDB();

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  for (const [key, value] of Object.entries(newData)) {
    updates[`data.${key}`] = value;
  }

  await WhatsAppSession.updateOne({ phoneNumber }, { $set: updates });
}
