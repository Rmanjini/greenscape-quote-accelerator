// Real customer delivery via Resend. Sends the proposal PDF as an attachment.
// If RESEND_API_KEY is unset the caller falls back to the GHL mock, so the app
// still works without email configured.
//
// Note: Resend's shared sender (onboarding@resend.dev) can only deliver to the
// account owner's own verified email. To email arbitrary customer addresses,
// verify a domain and set RESEND_FROM to an address on it.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Greenscape Pro <onboarding@resend.dev>";

export const resendConfigured = () => Boolean(RESEND_API_KEY);

export interface EmailResult {
  ok: boolean;
  message_id: string;
  error?: string;
}

export async function sendProposalEmail(args: {
  to: string;
  customerName: string;
  projectName: string | null;
  total: number;
  pdf: Buffer;
}): Promise<EmailResult> {
  const money = `$${Number(args.total).toLocaleString("en-US")}`;
  const project = args.projectName ? ` - ${args.projectName}` : "";
  const html = `
    <div style="font-family:system-ui,sans-serif;color:#111;max-width:560px">
      <h2 style="color:#1f6d3b">Your Greenscape Pro Proposal</h2>
      <p>Hi ${args.customerName},</p>
      <p>Thanks for having us out. Your proposal${project} is attached as a PDF.
      The total investment is <strong>${money}</strong>.</p>
      <p>Reply to this email to approve, or with any questions - we're happy to
      walk through the details.</p>
      <p style="color:#555">- Greenscape Pro - Phoenix, AZ</p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [args.to],
        subject: `Your Greenscape Pro Proposal${project}`,
        html,
        attachments: [{ filename: "greenscape-proposal.pdf", content: args.pdf.toString("base64") }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message_id: "", error: data?.message || `HTTP ${res.status}` };
    return { ok: true, message_id: data?.id ?? "resend" };
  } catch (e: any) {
    return { ok: false, message_id: "", error: e?.message ?? "email send failed" };
  }
}
