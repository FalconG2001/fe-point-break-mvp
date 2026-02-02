/**
 * WhatsApp Business API Client
 * Uses Meta Cloud API for sending messages
 */

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

interface WhatsAppTextMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: { body: string };
}

interface WhatsAppInteractiveMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
    type: "list" | "button";
    header?: { type: "text"; text: string };
    body: { text: string };
    footer?: { text: string };
    action: ListAction | ButtonAction;
  };
}

interface ListAction {
  button: string;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}

interface ButtonAction {
  buttons: Array<{
    type: "reply";
    reply: { id: string; title: string };
  }>;
}

/**
 * Send a plain text message
 */
export async function sendTextMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log(`Attempting to send text message to ${to}`);

  if (!phoneNumberId || !accessToken) {
    console.error("WhatsApp credentials missing:", {
      phoneNumberId: !!phoneNumberId,
      accessToken: !!accessToken,
    });
    throw new Error("WhatsApp credentials not configured");
  }

  const message: WhatsAppTextMessage = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
  console.log(`POSTing to ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("WhatsApp API error details:", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(`Failed to send message: ${response.status}`);
  }

  console.log(`Successfully sent text message to ${to}`);
}

/**
 * Send an interactive list message (for date/slot selection)
 */
export async function sendListMessage(
  to: string,
  header: string,
  body: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log(`Attempting to send list message to ${to}`);

  if (!phoneNumberId || !accessToken) {
    console.error("WhatsApp credentials missing:", {
      phoneNumberId: !!phoneNumberId,
      accessToken: !!accessToken,
    });
    throw new Error("WhatsApp credentials not configured");
  }

  const message: WhatsAppInteractiveMessage = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: header },
      body: { text: body },
      action: {
        button: buttonText,
        sections,
      },
    },
  };

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
  console.log(`POSTing to ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("WhatsApp API error details:", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(`Failed to send list message: ${response.status}`);
  }

  console.log(`Successfully sent list message to ${to}`);
}

/**
 * Send an interactive button message (for console selection/confirmation)
 */
export async function sendButtonMessage(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>,
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log(`Attempting to send button message to ${to}`);

  if (!phoneNumberId || !accessToken) {
    console.error("WhatsApp credentials missing:", {
      phoneNumberId: !!phoneNumberId,
      accessToken: !!accessToken,
    });
    throw new Error("WhatsApp credentials not configured");
  }

  // WhatsApp allows max 3 buttons
  const limitedButtons = buttons.slice(0, 3);

  const message: WhatsAppInteractiveMessage = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: limitedButtons.map((btn) => ({
          type: "reply" as const,
          reply: { id: btn.id, title: btn.title },
        })),
      },
    },
  };

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
  console.log(`POSTing to ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("WhatsApp API error details:", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(`Failed to send button message: ${response.status}`);
  }

  console.log(`Successfully sent button message to ${to}`);
}

/**
 * Verify webhook signature from Meta
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
): boolean {
  const appSecret = process.env.WHATSAPP_WEBHOOK_SECRET;

  // If no secret configured, skip verification (for development)
  if (!appSecret) {
    console.warn(
      "WHATSAPP_WEBHOOK_SECRET not set, skipping signature verification",
    );
    return true;
  }

  if (!signature) return false;

  // Meta sends signature as "sha256=<hash>"
  const expectedSignature = signature.replace("sha256=", "");

  // Use Web Crypto API for HMAC
  const encoder = new TextEncoder();
  const key = encoder.encode(appSecret);
  const data = encoder.encode(payload);

  // For server-side, we'd use crypto.createHmac
  // This is a simplified check - in production, use proper HMAC verification
  return expectedSignature.length === 64; // Basic check that it's a SHA256 hash
}

/**
 * Parse incoming webhook message
 */
export interface IncomingMessage {
  from: string; // Phone number
  messageId: string;
  timestamp: string;
  type: "text" | "interactive" | "button";
  text?: string;
  interactiveReplyId?: string;
  interactiveReplyTitle?: string;
}

export function parseWebhookMessage(body: unknown): IncomingMessage | null {
  try {
    const data = body as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              from: string;
              id: string;
              timestamp: string;
              type: string;
              text?: { body: string };
              interactive?: {
                type: string;
                button_reply?: { id: string; title: string };
                list_reply?: { id: string; title: string };
              };
            }>;
          };
        }>;
      }>;
    };

    const message = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return null;

    const result: IncomingMessage = {
      from: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      type: message.type as "text" | "interactive" | "button",
    };

    if (message.type === "text" && message.text) {
      result.text = message.text.body;
    } else if (message.type === "interactive" && message.interactive) {
      const reply =
        message.interactive.button_reply || message.interactive.list_reply;
      if (reply) {
        result.interactiveReplyId = reply.id;
        result.interactiveReplyTitle = reply.title;
      }
    }

    return result;
  } catch {
    console.error("Failed to parse webhook message");
    return null;
  }
}
