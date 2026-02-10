/**
 * WhatsApp Session Manager
 * Manages conversation state for booking flow
 */

import { getDb } from "./mongodb";

export type SessionState =
  | "idle"
  | "awaiting_date"
  | "awaiting_slot"
  | "awaiting_console"
  | "awaiting_name"
  | "awaiting_confirm";

export interface WhatsAppSession {
  phoneNumber: string;
  state: SessionState;
  // data shape
  data: {
    date?: string;
    slot?: string;
    slotPage?: number; // ✅ add this
    consoleId?: string;
    customerName?: string;
    duration?: number;
  };
  updatedAt: Date;
  createdAt: Date;
}

const COLLECTION_NAME = "whatsapp_sessions";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a session for a phone number
 */
export async function getSession(
  phoneNumber: string,
): Promise<WhatsAppSession> {
  const db = await getDb();
  const collection = db.collection<WhatsAppSession>(COLLECTION_NAME);

  const existing = await collection.findOne({ phoneNumber });

  // Check if session exists and is not expired
  if (existing) {
    const now = new Date();
    const timeSinceUpdate = now.getTime() - existing.updatedAt.getTime();

    if (timeSinceUpdate < SESSION_TIMEOUT_MS) {
      return existing;
    }

    // Session expired, delete it
    await collection.deleteOne({ phoneNumber });
  }

  // Create new session
  const newSession: WhatsAppSession = {
    phoneNumber,
    state: "idle",
    data: {},
    updatedAt: new Date(),
    createdAt: new Date(),
  };

  await collection.insertOne(newSession);
  return newSession;
}

/**
 * Update session state and data
 */
export async function updateSession(
  phoneNumber: string,
  state: SessionState,
  data: Partial<WhatsAppSession["data"]> = {},
): Promise<void> {
  const db = await getDb();
  const collection = db.collection<WhatsAppSession>(COLLECTION_NAME);

  await collection.updateOne(
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
  const db = await getDb();
  const collection = db.collection<WhatsAppSession>(COLLECTION_NAME);

  await collection.deleteOne({ phoneNumber });
}

/**
 * Add data to existing session without replacing
 */
export async function mergeSessionData(
  phoneNumber: string,
  newData: Partial<WhatsAppSession["data"]>,
): Promise<void> {
  const db = await getDb();
  const collection = db.collection<WhatsAppSession>(COLLECTION_NAME);

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  for (const [key, value] of Object.entries(newData)) {
    updates[`data.${key}`] = value;
  }

  await collection.updateOne({ phoneNumber }, { $set: updates });
}
