import { NextResponse } from "next/server";
import {
  sendTextMessage,
  sendListMessage,
  sendButtonMessage,
  parseWebhookMessage,
} from "@/lib/whatsapp";
import { sendBookingNotification } from "@/lib/whatsapp-notify";
import {
  getSession,
  updateSession,
  clearSession,
  mergeSessionData,
  type SessionState,
} from "@/lib/whatsapp-session";
import { connectToDB } from "@/lib/mongodb";
import Booking from "@/models/booking";
import {
  CONSOLES,
  TV_COUNT,
  type ConsoleId,
  todayYmd,
  isSlotPast,
  getSlotsForDuration,
  CENTRE_NAME,
  getStartSlotsForDate,
} from "@/lib/config";

// Default duration for WhatsApp bookings (1 hour)
const DEFAULT_DURATION = 60;

const MAX_WA_BOOKINGS_PER_DAY = 3;

async function countActiveWhatsAppBookings(phone: string, date: string) {
  await connectToDB();
  return Booking.countDocuments({
    date,
    bookingFrom: "whatsapp",
    confirmed: { $ne: false },
    "customer.phone": phone,
  });
}

async function getActiveWhatsAppBookingsForDates(
  phone: string,
  dates: string[],
) {
  await connectToDB();
  return Booking.find({
    bookingFrom: "whatsapp",
    confirmed: { $ne: false },
    "customer.phone": phone,
    date: { $in: dates },
  })
    .select("date slot selections")
    .sort({ date: 1, slot: 1 })
    .lean();
}

/**
 * GET - Webhook verification endpoint
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
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
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json(
        { status: "error", message: "Invalid JSON" },
        { status: 400 },
      );
    }

    const message = parseWebhookMessage(body);
    if (!message) return NextResponse.json({ status: "ok" });

    const session = await getSession(message.from);
    await handleMessage(message.from, session.state, session.data, message);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ status: "error" });
  }
}

/**
 * Main message handler
 */
async function handleMessage(
  from: string,
  state: SessionState,
  data: Record<string, unknown>,
  message: { text?: string; interactiveReplyId?: string },
) {
  const text = message.text?.toLowerCase().trim() || "";
  const replyId = message.interactiveReplyId || "";

  if (replyId === "book_again" || replyId === "show_dates") {
    await clearSession(from);
    await handleIdle(from, "book");
    return;
  }

  const resetKeywords = [
    "cancel",
    "reset",
    "start over",
    "book",
    "hi",
    "hello",
    "hey",
    "start",
    "ping",
  ];
  if (resetKeywords.includes(text)) {
    if (text === "ping") {
      await sendTextMessage(from, "pong 🏓");
      return;
    }
    await clearSession(from);
    await handleIdle(from, text);
    return;
  }

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
 * Handle idle state
 */
async function handleIdle(from: string, text: string) {
  const keywords = ["book", "hi", "hello", "hey", "start", "menu"];
  const isGreeting = keywords.some((k) => text.includes(k)) || text.length < 20;

  if (!isGreeting && text.length > 0) {
    await sendTextMessage(
      from,
      `Welcome to ${CENTRE_NAME}! 🎮\n\nSend 'book' to make a reservation.`,
    );
    return;
  }

  const dates = [todayYmd(0), todayYmd(1), todayYmd(2)];
  const existing = await getActiveWhatsAppBookingsForDates(from, dates);

  if (existing.length > 0) {
    const byDate = new Map<string, any[]>();
    for (const b of existing) {
      const arr = byDate.get((b as any).date) ?? [];
      arr.push(b);
      byDate.set((b as any).date, arr);
    }

    let msg = `You already have bookings:\n`;
    for (const d of dates) {
      const list = byDate.get(d) ?? [];
      if (list.length === 0) continue;
      msg += `\n${formatDateDisplay(d)} (${list.length}/${MAX_WA_BOOKINGS_PER_DAY})\n`;
      for (const b of list) msg += `• ${b.slot}\n`;
    }

    const canBookAny = dates.some(
      (d) => (byDate.get(d)?.length ?? 0) < MAX_WA_BOOKINGS_PER_DAY,
    );
    if (canBookAny) {
      await sendButtonMessage(from, msg + `\nWant to book again?`, [
        { id: "book_again", title: "Book again" },
        { id: "show_dates", title: "Pick date" },
      ]);
    } else {
      await sendTextMessage(
        from,
        msg + `\nDaily limit reached for all available dates.`,
      );
    }
  }

  await updateSession(from, "awaiting_date", {});
  await sendListMessage(
    from,
    `${CENTRE_NAME} Booking`,
    "Pick a date:\n\n(Send 'cancel' to start over)",
    "Select Date",
    [
      {
        title: "Available Dates",
        rows: [
          {
            id: `date_${dates[0]}`,
            title: "Today",
            description: formatDateDisplay(dates[0]),
          },
          {
            id: `date_${dates[1]}`,
            title: "Tomorrow",
            description: formatDateDisplay(dates[1]),
          },
          {
            id: `date_${dates[2]}`,
            title: "Day After Tomorrow",
            description: formatDateDisplay(dates[2]),
          },
        ],
      },
    ],
  );
}

async function handleDateSelection(from: string, replyId: string) {
  if (!replyId.startsWith("date_")) {
    await sendTextMessage(from, "Please select a date from the list above.");
    return;
  }
  const date = replyId.replace("date_", "");
  const used = await countActiveWhatsAppBookings(from, date);

  if (used >= MAX_WA_BOOKINGS_PER_DAY) {
    await sendTextMessage(
      from,
      `You already have ${used}/${MAX_WA_BOOKINGS_PER_DAY} bookings for ${formatDateDisplay(date)}.\nPick another date.`,
    );
    await clearSession(from);
    await handleIdle(from, "book");
    return;
  }

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

  await updateSession(from, "awaiting_slot", { date, slotPage: 0 });
  await sendSlotListPage(from, date, 0);
}

async function handleSlotSelection(
  from: string,
  replyId: string,
  date: string,
) {
  if (replyId.startsWith("slotnav_")) {
    const page = Number(replyId.replace("slotnav_", ""));
    if (Number.isFinite(page) && page >= 0)
      await sendSlotListPage(from, date, page);
    return;
  }
  if (!replyId.startsWith("slot_")) {
    await sendTextMessage(from, "Please select a time slot from the list.");
    return;
  }
  const slot = replyId.replace("slot_", "");
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

  const consoleButtons = slotInfo.availableConsoleIds.slice(0, 3).map((id) => {
    const console = CONSOLES.find((c) => c.id === id);
    return { id: `console_${id}`, title: console?.short || id };
  });

  await sendButtonMessage(
    from,
    `📅 ${formatDateDisplay(date)} at ${slot}\n\nSelect your console:\n\n(Send 'cancel' to start over)`,
    consoleButtons,
  );
}

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
    `📋 *Booking Summary*\n\n📅 Date: ${formatDateDisplay(date)}\n⏰ Time: ${slot}\n🎮 Console: ${consoleName}\n⏱️ Duration: ${duration} mins\n👤 Name: ${name}\n\nConfirm your booking?\n\n(Send 'cancel' to start over)`,
    [
      { id: "confirm_yes", title: "✅ Confirm" },
      { id: "confirm_no", title: "❌ Cancel" },
    ],
  );
}

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
  const used = await countActiveWhatsAppBookings(from, date);

  if (used >= MAX_WA_BOOKINGS_PER_DAY) {
    await sendTextMessage(
      from,
      `Limit reached: ${used}/${MAX_WA_BOOKINGS_PER_DAY} bookings for ${formatDateDisplay(date)}.\nTry another date.`,
    );
    await clearSession(from);
    return;
  }

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

  try {
    const booking = new Booking({
      date,
      slot,
      selections: [{ consoleId, duration, players: 1 }],
      customer: { name: customerName, phone: from, userType: "normal" },
      confirmed: true,
      bookingFrom: "whatsapp",
    });
    const res = await booking.save();

    sendBookingNotification({
      bookingId: String(res._id),
      date,
      slot,
      selections: [{ consoleId, duration, players: 1 }],
      customerName,
      customerPhone: from,
      bookingFrom: "whatsapp",
    }).catch(() => {});

    const consoleName =
      CONSOLES.find((c) => c.id === consoleId)?.name || consoleId;
    await clearSession(from);
    await sendTextMessage(
      from,
      `✅ *Booking Confirmed!*\n\n📅 ${formatDateDisplay(date)}\n⏰ ${slot}\n🎮 ${consoleName}\n⏱️ ${duration} mins\n\nSee you at ${CENTRE_NAME}! 🎮\n\nSend 'book' to make another reservation.`,
    );
  } catch (error) {
    await sendTextMessage(
      from,
      "Sorry, something went wrong. Please try again or contact us directly.",
    );
  }
}

async function getAvailability(
  date: string,
  durationMinutes: number = DEFAULT_DURATION,
) {
  await connectToDB();
  const bookings = await Booking.find({ date, confirmed: { $ne: false } })
    .select("slot selections")
    .lean();
  const bySlot = new Map<string, Set<ConsoleId>>();

  for (const b of bookings) {
    const startSlot: string = (b as any).slot;
    const sel = (b as any).selections || [];
    for (const s of sel) {
      if (!s?.consoleId) continue;
      const consoleId = s.consoleId as ConsoleId;
      const coveredSlots = getSlotsForDuration(startSlot, s.duration || 60);
      for (const covered of coveredSlots) {
        const set = bySlot.get(covered) ?? new Set<ConsoleId>();
        set.add(consoleId);
        bySlot.set(covered, set);
      }
    }
  }

  const allIds = CONSOLES.map((c) => c.id) as ConsoleId[];
  const startSlots = getStartSlotsForDate(date, durationMinutes);

  return startSlots.map((start) => {
    const isPast = isSlotPast(date, start);
    const covered = getSlotsForDuration(start, durationMinutes);
    const bookedSet = new Set<ConsoleId>();
    for (const t of covered) {
      for (const cid of bySlot.get(t) ?? []) bookedSet.add(cid);
    }
    const tvRemaining = isPast ? 0 : Math.max(0, TV_COUNT - bookedSet.size);
    return {
      slot: start,
      bookedConsoleIds: Array.from(bookedSet),
      availableConsoleIds:
        tvRemaining <= 0 ? [] : allIds.filter((id) => !bookedSet.has(id)),
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

const SLOT_PAGE_SIZE = 8; // 8 times + prev/next = max 10 rows

async function sendSlotListPage(from: string, date: string, page: number) {
  const availability = await getAvailability(date, DEFAULT_DURATION);
  const availableSlots = availability.filter(
    (s) => !s.isPast && s.tvRemaining > 0,
  );

  const start = page * SLOT_PAGE_SIZE;
  const pageItems = availableSlots.slice(start, start + SLOT_PAGE_SIZE);

  const rows: Array<{ id: string; title: string; description?: string }> = [];

  const hasPrev = page > 0;
  const hasNext = start + SLOT_PAGE_SIZE < availableSlots.length;

  if (hasPrev) {
    rows.push({
      id: `slotnav_${page - 1}`,
      title: "⬅️ Back",
      description: "Previous times",
    });
  }

  rows.push(
    ...pageItems.map((s) => ({
      id: `slot_${s.slot}`,
      title: s.slot,
      description: `${s.tvRemaining} TV${s.tvRemaining > 1 ? "s" : ""} available`,
    })),
  );

  if (hasNext) {
    rows.push({
      id: `slotnav_${page + 1}`,
      title: "More times",
      description: "Next options",
    });
  }

  await mergeSessionData(from, { slotPage: page });

  await sendListMessage(
    from,
    "Select Time Slot",
    `📅 ${formatDateDisplay(date)}\n\nChoose your preferred time:\n\n(Send 'cancel' to start over)`,
    "Select Time",
    [{ title: "Available Slots", rows }],
  );
}
