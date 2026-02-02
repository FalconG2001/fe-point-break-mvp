/**
 * WhatsApp Webhook Handler
 * Handles incoming messages and routes to appropriate handlers
 */

import { NextResponse } from "next/server";
import {
  sendTextMessage,
  sendListMessage,
  sendButtonMessage,
  parseWebhookMessage,
} from "@/lib/whatsapp";
import {
  getSession,
  updateSession,
  clearSession,
  mergeSessionData,
  type SessionState,
} from "@/lib/whatsapp-session";
import { getDb } from "@/lib/mongodb";
import {
  CONSOLES,
  SLOTS,
  TV_COUNT,
  type ConsoleId,
  todayYmd,
  isSlotPast,
  getSlotsForDuration,
  CENTRE_NAME,
} from "@/lib/config";

// Default duration for WhatsApp bookings (1 hour)
const DEFAULT_DURATION = 60;

/**
 * GET - Webhook verification endpoint
 * Meta sends a GET request to verify the webhook
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp webhook verified");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST - Handle incoming messages
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    console.log("Incoming WhatsApp Webhook Body:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error("Failed to parse JSON body:", e);
      return NextResponse.json(
        { status: "error", message: "Invalid JSON" },
        { status: 400 },
      );
    }

    // Parse the incoming message
    const message = parseWebhookMessage(body);
    console.log("Parsed WhatsApp Message:", message);

    // If no message (could be status update), acknowledge
    if (!message) {
      console.log(
        "No valid message found in webhook payload (likely a status update)",
      );
      return NextResponse.json({ status: "ok" });
    }

    // Get or create session for this user
    console.log(`Getting session for ${message.from}`);
    const session = await getSession(message.from);
    console.log(`Current state for ${message.from}: ${session.state}`);

    // Route based on session state and message type
    await handleMessage(message.from, session.state, session.data, message);

    console.log(`Successfully handled message from ${message.from}`);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Always return 200 to acknowledge receipt (Meta requires this)
    return NextResponse.json({ status: "error" });
  }
}

/**
 * Main message handler - routes based on state
 */
async function handleMessage(
  from: string,
  state: SessionState,
  data: Record<string, unknown>,
  message: { text?: string; interactiveReplyId?: string },
) {
  const text = message.text?.toLowerCase().trim() || "";
  const replyId = message.interactiveReplyId || "";

  // Handle reset/cancel commands anytime
  const resetKeywords = [
    "cancel",
    "reset",
    "start over",
    "book",
    "hi",
    "hello",
    "hey",
    "start",
  ];
  if (resetKeywords.includes(text)) {
    await clearSession(from);
    await handleIdle(from, text);
    return;
  }

  // Route based on state
  switch (state) {
    case "idle":
      await handleIdle(from, text);
      break;
    case "awaiting_date":
      await handleDateSelection(from, replyId);
      break;
    case "awaiting_slot":
      await handleSlotSelection(from, replyId, data.date as string);
      break;
    case "awaiting_console":
      await handleConsoleSelection(
        from,
        replyId,
        data.date as string,
        data.slot as string,
      );
      break;
    case "awaiting_name":
      await handleNameInput(from, message.text || "", data);
      break;
    case "awaiting_confirm":
      await handleConfirmation(from, replyId, data);
      break;
    default:
      await handleIdle(from, text);
  }
}

/**
 * Handle idle state - show welcome and date options
 */
async function handleIdle(from: string, text: string) {
  // Any message starts the booking flow
  const keywords = ["book", "hi", "hello", "hey", "start", "menu"];
  const isGreeting = keywords.some((k) => text.includes(k)) || text.length < 20;

  if (!isGreeting && text.length > 0) {
    await sendTextMessage(
      from,
      `Welcome to ${CENTRE_NAME}! 🎮\n\nSend 'book' to make a reservation.`,
    );
    return;
  }

  // Show date selection
  const dates = [
    { id: todayYmd(0), label: "Today" },
    { id: todayYmd(1), label: "Tomorrow" },
    { id: todayYmd(2), label: "Day After Tomorrow" },
  ];

  await updateSession(from, "awaiting_date", {});

  await sendListMessage(
    from,
    `${CENTRE_NAME} Booking`,
    "Welcome! 🎮\n\nLet's book your gaming session. First, pick a date:\n\n(Send 'cancel' to start over)",
    "Select Date",
    [
      {
        title: "Available Dates",
        rows: dates.map((d) => ({
          id: `date_${d.id}`,
          title: d.label,
          description: formatDateDisplay(d.id),
        })),
      },
    ],
  );
}

/**
 * Handle date selection - show available slots
 */
async function handleDateSelection(from: string, replyId: string) {
  if (!replyId.startsWith("date_")) {
    await sendTextMessage(from, "Please select a date from the list above.");
    return;
  }

  const date = replyId.replace("date_", "");

  // Get availability for this date
  const availability = await getAvailability(date);
  const availableSlots = availability.filter(
    (s) => !s.isPast && s.tvRemaining > 0,
  );

  if (availableSlots.length === 0) {
    await sendTextMessage(
      from,
      `Sorry, no slots available for ${formatDateDisplay(date)}. Please try another date.\n\nSend 'book' to start over.`,
    );
    await clearSession(from);
    return;
  }

  await updateSession(from, "awaiting_slot", { date });

  // Group slots for better UX (show every 30 mins)
  const slotRows = availableSlots
    // .filter((_, i) => i % 2 === 0) // Show every 30 min slot
    // .slice(0, 10) // Max 10 items per section
    .map((s) => ({
      id: `slot_${s.slot}`,
      title: s.slot,
      description: `${s.tvRemaining} TV${s.tvRemaining > 1 ? "s" : ""} available`,
    }));

  await sendListMessage(
    from,
    "Select Time Slot",
    `📅 ${formatDateDisplay(date)}\n\nChoose your preferred time:\n\n(Send 'cancel' to start over)`,
    "Select Time",
    [{ title: "Available Slots", rows: slotRows }],
  );
}

/**
 * Handle slot selection - show available consoles
 */
async function handleSlotSelection(
  from: string,
  replyId: string,
  date: string,
) {
  if (!replyId.startsWith("slot_")) {
    await sendTextMessage(from, "Please select a time slot from the list.");
    return;
  }

  const slot = replyId.replace("slot_", "");

  // Get available consoles for this slot
  const availability = await getAvailability(date);
  const slotInfo = availability.find((s) => s.slot === slot);

  if (!slotInfo || slotInfo.availableConsoleIds.length === 0) {
    await sendTextMessage(
      from,
      `Sorry, ${slot} is no longer available. Please select another time.\n\nSend 'book' to start over.`,
    );
    await clearSession(from);
    return;
  }

  await mergeSessionData(from, { slot });
  await updateSession(from, "awaiting_console", { date, slot });

  // Show available consoles as buttons (max 3)
  const consoleButtons = slotInfo.availableConsoleIds.slice(0, 3).map((id) => {
    const console = CONSOLES.find((c) => c.id === id);
    return {
      id: `console_${id}`,
      title: console?.short || id,
    };
  });

  await sendButtonMessage(
    from,
    `📅 ${formatDateDisplay(date)} at ${slot}\n\nSelect your console:\n\n(Send 'cancel' to start over)`,
    consoleButtons,
  );
}

/**
 * Handle console selection - ask for name
 */
async function handleConsoleSelection(
  from: string,
  replyId: string,
  date: string,
  slot: string,
) {
  if (!replyId.startsWith("console_")) {
    await sendTextMessage(from, "Please select a console from the buttons.");
    return;
  }

  const consoleId = replyId.replace("console_", "") as ConsoleId;
  const consoleName =
    CONSOLES.find((c) => c.id === consoleId)?.name || consoleId;

  await updateSession(from, "awaiting_name", {
    date,
    slot,
    consoleId,
    duration: DEFAULT_DURATION,
  });

  await sendTextMessage(
    from,
    `Great choice! 🎮 ${consoleName}\n\nPlease enter your name for the booking:\n\n(Send 'cancel' to start over)`,
  );
}

/**
 * Handle name input - show confirmation
 */
async function handleNameInput(
  from: string,
  name: string,
  data: Record<string, unknown>,
) {
  if (!name || name.length < 2) {
    await sendTextMessage(
      from,
      "Please enter a valid name (at least 2 characters).",
    );
    return;
  }

  const { date, slot, consoleId, duration } = data as {
    date: string;
    slot: string;
    consoleId: ConsoleId;
    duration: number;
  };

  const consoleName =
    CONSOLES.find((c) => c.id === consoleId)?.name || consoleId;

  await updateSession(from, "awaiting_confirm", {
    date,
    slot,
    consoleId,
    customerName: name,
    duration,
  });

  await sendButtonMessage(
    from,
    `📋 *Booking Summary*\n\n` +
      `📅 Date: ${formatDateDisplay(date)}\n` +
      `⏰ Time: ${slot}\n` +
      `🎮 Console: ${consoleName}\n` +
      `⏱️ Duration: ${duration} mins\n` +
      `👤 Name: ${name}\n\n` +
      `Confirm your booking?\n\n(Send 'cancel' to start over)`,
    [
      { id: "confirm_yes", title: "✅ Confirm" },
      { id: "confirm_no", title: "❌ Cancel" },
    ],
  );
}

/**
 * Handle confirmation - create booking
 */
async function handleConfirmation(
  from: string,
  replyId: string,
  data: Record<string, unknown>,
) {
  if (replyId === "confirm_no") {
    await clearSession(from);
    await sendTextMessage(
      from,
      "Booking cancelled. Send 'book' anytime to start a new booking.",
    );
    return;
  }

  if (replyId !== "confirm_yes") {
    await sendTextMessage(from, "Please tap Confirm or Cancel.");
    return;
  }

  const { date, slot, consoleId, customerName, duration } = data as {
    date: string;
    slot: string;
    consoleId: ConsoleId;
    customerName: string;
    duration: number;
  };

  // Double-check availability before creating booking
  const availability = await getAvailability(date);
  const slotInfo = availability.find((s) => s.slot === slot);

  if (!slotInfo || !slotInfo.availableConsoleIds.includes(consoleId)) {
    await sendTextMessage(
      from,
      `Sorry, ${slot} with that console is no longer available. Someone just booked it!\n\nSend 'book' to try again.`,
    );
    await clearSession(from);
    return;
  }

  // Create the booking
  try {
    const db = await getDb();
    const doc = {
      date,
      slot,
      selections: [
        {
          consoleId,
          duration,
          players: 1,
        },
      ],
      customer: {
        name: customerName,
        phone: from,
      },
      confirmed: true,
      bookingFrom: "whatsapp",
      createdAt: new Date().toISOString(),
    };

    await db.collection("bookings").insertOne(doc);

    const consoleName =
      CONSOLES.find((c) => c.id === consoleId)?.name || consoleId;

    await clearSession(from);
    await sendTextMessage(
      from,
      `✅ *Booking Confirmed!*\n\n` +
        `📅 ${formatDateDisplay(date)}\n` +
        `⏰ ${slot}\n` +
        `🎮 ${consoleName}\n` +
        `⏱️ ${duration} mins\n\n` +
        `See you at ${CENTRE_NAME}! 🎮\n\n` +
        `Send 'book' to make another reservation.`,
    );
  } catch (error) {
    console.error("Failed to create booking:", error);
    await sendTextMessage(
      from,
      "Sorry, something went wrong. Please try again or contact us directly.",
    );
  }
}

/**
 * Get availability for a date (reuses existing logic)
 */
async function getAvailability(date: string) {
  const db = await getDb();
  const bookings = await db
    .collection("bookings")
    .find({ date, confirmed: { $ne: false } })
    .project({ _id: 0, slot: 1, selections: 1 })
    .toArray();

  // Build slot -> booked consoles map
  const bySlot = new Map<string, Set<ConsoleId>>();

  for (const b of bookings) {
    const startSlot: string = b.slot;
    const sel = Array.isArray(b.selections) ? b.selections : [];

    for (const s of sel) {
      if (!s?.consoleId) continue;
      const consoleId = s.consoleId as ConsoleId;
      const duration = s.duration || 60;
      const coveredSlots = getSlotsForDuration(startSlot, duration);

      for (const coveredSlot of coveredSlots) {
        const set = bySlot.get(coveredSlot) ?? new Set<ConsoleId>();
        set.add(consoleId);
        bySlot.set(coveredSlot, set);
      }
    }
  }

  const allIds = CONSOLES.map((c) => c.id) as ConsoleId[];

  return SLOTS.map((slot) => {
    const isPast = isSlotPast(date, slot);
    const booked = Array.from(bySlot.get(slot) ?? new Set<ConsoleId>());
    const bookedCount = booked.length;
    const tvRemaining = isPast ? 0 : Math.max(0, TV_COUNT - bookedCount);
    const availableConsoleIds =
      tvRemaining <= 0 ? [] : allIds.filter((id) => !booked.includes(id));

    return {
      slot,
      bookedConsoleIds: booked,
      availableConsoleIds,
      tvRemaining,
      isPast,
    };
  });
}

/**
 * Format date for display (e.g., "Feb 1, Sat")
 */
function formatDateDisplay(ymd: string): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}
