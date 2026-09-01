import { supabase } from "@/lib/supabase";
import { sendProposalToCustomer } from "@/lib/ghl";
import { formatCustomerProposal } from "@/lib/proposal";
import type { Proposal, ProposalItem } from "@/types";

export interface ApproveResult {
  ok: boolean;
  status?: string;
  already?: boolean;
  error?: string;
  code?: "NOT_FOUND" | "MISSING_EMAIL" | "SEND_FAILED";
}

// Approve a proposal and send it to the customer. The ONLY path that puts a
// quote in front of a customer, and it always requires an explicit human actor.
// Guardrails: idempotent (no double-send), email required, and status only
// becomes SENT if the send actually succeeds.
export async function approveAndSend(proposalId: string, actor: string): Promise<ApproveResult> {
  const { data: p } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();
  if (!p) return { ok: false, code: "NOT_FOUND", error: "Proposal not found" };
  const proposal = p as Proposal;

  // Idempotency: never send twice.
  if (proposal.status === "SENT") {
    return { ok: true, already: true, status: "SENT" };
  }

  const { data: contact } = await supabase
    .from("contacts")
    .select("name, email, ghl_contact_id")
    .eq("id", proposal.contact_id)
    .maybeSingle();

  // Guardrail: don't send without a way to reach the customer.
  if (!contact?.email && !contact?.ghl_contact_id) {
    return { ok: false, code: "MISSING_EMAIL", error: "Customer email is required before sending" };
  }

  // Mark APPROVED first (human decision recorded even if the send later fails).
  await supabase
    .from("proposals")
    .update({
      status: "APPROVED",
      approved_by: actor,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);
  await supabase.from("audit_logs").insert({
    proposal_id: proposalId,
    actor,
    action: "approved",
  });

  const { data: items } = await supabase
    .from("proposal_items")
    .select("*")
    .eq("proposal_id", proposalId);
  const body = formatCustomerProposal(
    proposal,
    (items ?? []) as ProposalItem[],
    contact?.name ?? "Customer"
  );

  const sent = await sendProposalToCustomer({
    ghl_contact_id: contact?.ghl_contact_id ?? null,
    customer_email: contact?.email ?? null,
    body,
  });

  if (!sent.ok) {
    // Stay APPROVED — never falsely show SENT.
    await supabase.from("audit_logs").insert({
      proposal_id: proposalId,
      actor,
      action: "send_failed",
      metadata: { error: sent.error },
    });
    return { ok: false, code: "SEND_FAILED", status: "APPROVED", error: sent.error };
  }

  await supabase
    .from("proposals")
    .update({
      status: "SENT",
      sent_at: new Date().toISOString(),
      ghl_message_id: sent.message_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);
  await supabase.from("audit_logs").insert({
    proposal_id: proposalId,
    actor,
    action: "sent",
    metadata: { via: sent.mode, ghl_message_id: sent.message_id },
  });

  return { ok: true, status: "SENT" };
}
