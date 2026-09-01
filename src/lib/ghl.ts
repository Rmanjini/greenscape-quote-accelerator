// GoHighLevel adapter. GHL is the client's system of record ("everything has to
// be in GHL or it won't get used" - Jenna). We have no GHL creds for the
// take-home, so this runs in MOCK mode by default and returns a synthetic
// message id. The interface is the real one, so swapping in the live API later
// is a single function body change, not a refactor.
//
// Adapter + mock instead of a half-real integration we can't test.
// Production target is the real GHL conversations/messages API.

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export const ghlLive = () => Boolean(GHL_API_KEY && GHL_LOCATION_ID);

export interface GhlSendResult {
  ok: boolean;
  message_id: string;
  mode: "live" | "mock";
  error?: string;
}

// Send the approved proposal to the customer via GHL (SMS/email).
export async function sendProposalToCustomer(args: {
  ghl_contact_id: string | null;
  customer_email: string | null;
  body: string;
}): Promise<GhlSendResult> {
  if (!ghlLive()) {
    // Deterministic fake id so the demo shows a real "SENT via GHL" record.
    const stamp = args.customer_email ?? args.ghl_contact_id ?? "unknown";
    return { ok: true, message_id: `mock-ghl-${Buffer.from(stamp).toString("hex").slice(0, 10)}`, mode: "mock" };
  }
  try {
    // Real GHL call would go here (POST /conversations/messages).
    const res = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: "2021-04-15",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "Email",
        contactId: args.ghl_contact_id,
        locationId: GHL_LOCATION_ID,
        message: args.body,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message_id: "", mode: "live", error: data?.message };
    return { ok: true, message_id: data?.messageId ?? data?.id ?? "ghl", mode: "live" };
  } catch (e: any) {
    return { ok: false, message_id: "", mode: "live", error: e?.message ?? "GHL send failed" };
  }
}
