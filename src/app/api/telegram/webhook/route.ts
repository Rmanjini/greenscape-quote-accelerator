import { NextResponse } from "next/server";
import { approveAndSend } from "@/lib/approve";
import { answerCallback, editMessageText } from "@/lib/telegram";

// Telegram calls this when Marcus taps an inline button. The URL carries a
// shared secret so only Telegram (which we register the webhook with) can hit it.
export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const cb = update?.callback_query;
  if (!cb) return NextResponse.json({ ok: true }); // ignore non-button updates

  const data: string = cb.data ?? "";
  const [action, id] = data.split(":");

  if (action === "approve" && id) {
    const result = await approveAndSend(id, "Marcus (telegram)");
    const msg = result.ok
      ? result.already
        ? "Already sent ✅"
        : "Approved & sent ✅"
      : result.code === "MISSING_EMAIL"
        ? "⚠️ Add a customer email before sending"
        : `⚠️ Send failed: ${result.error ?? "unknown"}`;
    await answerCallback(cb.id, msg);
    if (cb.message) {
      await editMessageText(
        cb.message.chat.id,
        cb.message.message_id,
        `${cb.message.text ?? "Quote"}\n\n- ${msg}`
      );
    }
  } else {
    await answerCallback(cb.id, "Unknown action");
  }

  return NextResponse.json({ ok: true });
}
