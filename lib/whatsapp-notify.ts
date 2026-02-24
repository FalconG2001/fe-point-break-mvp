/**
 * WhatsApp Booking Notification
 * Sends an alert to the admin whenever a booking is created.
 */

import { sendTemplateMessage } from "@/lib/whatsapp";
import { CONSOLES, CENTRE_NAME, type ConsoleId } from "@/lib/config";

/** Admin phone number to receive booking alerts (E.164 without '+') */
const ADMIN_NOTIFY_NUMBER = "917708110184";

export interface BookingNotificationDetails {
  bookingId: string;
  date: string;
  slot: string;
  selections: Array<{
    consoleId: string;
    duration: number;
    players?: number;
  }>;
  customerName: string;
  customerPhone: string;
  bookingFrom: string;
  totalPrice?: number;
}

/**
 * Format a date string (YYYY-MM-DD) for display (e.g. "Feb 17, Mon")
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

/**
 * Send a WhatsApp notification to the admin about a new booking.
 * This is fire-and-forget — errors are logged but never thrown.
 */
export async function sendBookingNotification(
  details: BookingNotificationDetails,
): Promise<void> {
  try {
    const consoleLines = details.selections
      .map((s) => {
        const consoleName =
          CONSOLES.find((c) => c.id === (s.consoleId as ConsoleId))?.name ||
          s.consoleId;
        return `${consoleName} - ${s.duration} mins${s.players ? ` (${s.players}P)` : ""}`;
      })
      .join(", ");

    const priceInfo =
      details.totalPrice !== undefined && details.totalPrice > 0
        ? ` | Total: Rs.${details.totalPrice}`
        : "";

    // var1: booking details line, var2: customer info, var3: booking ID
    const var1 =
      `${CENTRE_NAME} | ${formatDateDisplay(details.date)} ${details.slot} | ` +
      `${consoleLines}${priceInfo} | Source: ${details.bookingFrom}`;
    const var2 = `${details.customerName} (${details.customerPhone})`;
    const var3 = details.bookingId;

    await sendTemplateMessage(
      ADMIN_NOTIFY_NUMBER,
      "booking_notification",
      "en",
      [
        {
          type: "body",
          parameters: [
            { type: "text", text: var1 },
            { type: "text", text: var2 },
            { type: "text", text: var3 },
          ],
        },
      ],
    );
    console.log(`[notify] Booking notification sent for ${details.bookingId}`);
  } catch (error) {
    // Never let notification failure affect the booking
    console.error("[notify] Failed to send booking notification:", error);
  }
}
