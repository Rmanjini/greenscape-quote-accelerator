// Telegram = the real external integration. Marcus gets a phone push when a
// quote is ready and taps "Approve & Send" or "Review" without opening a laptop.
// Everything here is non-fatal: if Telegram isn't configured or errors, the
// proposal still lives in the DB — we never lose work over a notification.

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export const telegramConfigured = () => Boolean(TOKEN && CHAT_ID);

const api = (method: string) => `https://api.telegram.org/bot${TOKEN}/${method}`;

interface SendResult {
  ok: boolean;
  message_id?: number;
  skipped?: boolean;
  error?: string;
}

async function call(method: string, body: unknown): Promise<any> {
  const res = await fetch(api(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendMessage(
  text: string,
  reply_markup?: unknown,
  chatId: string = CHAT_ID || ""
): Promise<SendResult> {
  if (!telegramConfigured()) return { ok: false, skipped: true };
  try {
    const data = await call("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup,
    });
    if (!data.ok) return { ok: false, error: data.description };
    return { ok: true, message_id: data.result?.message_id };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "telegram send failed" };
  }
}

// "Quote ready" ping with inline Approve & Review buttons.
export async function notifyQuoteReady(p: {
  id: string;
  customer: string;
  total: number;
  needs_review: boolean;
  review_reasons: string[];
}): Promise<SendResult> {
  const money = `$${p.total.toLocaleString("en-US")}`;
  const flags = p.needs_review
    ? `\n\n⚠️ <b>${p.review_reasons.length} flag(s):</b>\n` +
      p.review_reasons.map((r) => `• ${r}`).join("\n")
    : "\n\n✅ No flags — clean quote.";
  const text =
    `🌿 <b>Quote ready for review</b>\n` +
    `Customer: <b>${p.customer}</b>\n` +
    `Total: <b>${money}</b>` +
    flags +
    `\n\n<i>No pricing was invented. Review before sending.</i>`;

  const reply_markup = {
    inline_keyboard: [
      [{ text: "✅ Approve & Send", callback_data: `approve:${p.id}` }],
      [{ text: "🔎 Review in dashboard", url: `${APP_URL}/quotes/${p.id}` }],
    ],
  };
  return sendMessage(text, reply_markup);
}

export async function answerCallback(callbackId: string, text: string): Promise<void> {
  if (!telegramConfigured()) return;
  await call("answerCallbackQuery", { callback_query_id: callbackId, text });
}

export async function editMessageText(
  chatId: number | string,
  messageId: number,
  text: string
): Promise<void> {
  if (!telegramConfigured()) return;
  await call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
  });
}
