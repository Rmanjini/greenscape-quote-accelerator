import { supabase } from "@/lib/supabase";
import { extractScope, PROMPT_VERSION } from "@/lib/extract";
import { computePricing } from "@/lib/pricing";
import { notifyQuoteReady } from "@/lib/telegram";
import type { PricingItem } from "@/types";

// Runs the whole AI pipeline for one proposal: extract -> price -> persist ->
// notify. Used by both quote creation and the "retry" button. Idempotent:
// re-running clears prior line items first.
export async function generateProposal(proposalId: string): Promise<{
  ok: boolean;
  needs_review?: boolean;
  total?: number;
  error?: string;
}> {
  const { data: proposal, error: pErr } = await supabase
    .from("proposals")
    .select("id, site_walk_notes, contact_id")
    .eq("id", proposalId)
    .single();
  if (pErr || !proposal) return { ok: false, error: "Proposal not found" };

  const { data: contact } = await supabase
    .from("contacts")
    .select("name")
    .eq("id", proposal.contact_id)
    .maybeSingle();

  const { data: catalogRows } = await supabase
    .from("pricing_items")
    .select("id, sku, name, description, category, unit, unit_price, active")
    .eq("active", true);
  const catalog: PricingItem[] = (catalogRows ?? []).map((c) => ({
    ...c,
    unit_price: Number(c.unit_price),
  }));

  try {
    const { result, usage } = await extractScope(proposal.site_walk_notes, catalog);
    const priced = computePricing(result, catalog);

    // Replace any prior line items (retry-safe).
    await supabase.from("proposal_items").delete().eq("proposal_id", proposalId);
    if (priced.items.length) {
      await supabase.from("proposal_items").insert(
        priced.items.map((i) => ({ ...i, proposal_id: proposalId }))
      );
    }

    const status = priced.needs_review ? "NEEDS_REVIEW" : "READY_FOR_APPROVAL";
    await supabase
      .from("proposals")
      .update({
        project_type: result.project_type,
        ai_summary: result.project_summary,
        assumptions: result.assumptions,
        exclusions: result.exclusions,
        potential_addons: result.potential_addons,
        unknowns: result.unknowns,
        needs_review: priced.needs_review,
        review_reasons: priced.review_reasons,
        subtotal: priced.subtotal,
        discount: priced.discount,
        total: priced.total,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    await supabase.from("ai_runs").insert({
      proposal_id: proposalId,
      model: usage.model,
      prompt_version: PROMPT_VERSION,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      latency_ms: usage.latency_ms,
      status: "ok",
    });
    await supabase.from("audit_logs").insert({
      proposal_id: proposalId,
      actor: "ai",
      action: "generated",
      metadata: { status, subtotal: priced.subtotal, flags: priced.review_reasons.length },
    });

    // Non-fatal: notify Marcus on his phone.
    await notifyQuoteReady({
      id: proposalId,
      customer: contact?.name ?? "Customer",
      total: priced.total,
      needs_review: priced.needs_review,
      review_reasons: priced.review_reasons,
    });

    return { ok: true, needs_review: priced.needs_review, total: priced.total };
  } catch (e: any) {
    const message = e?.message ?? "AI processing failed";
    await supabase.from("ai_runs").insert({
      proposal_id: proposalId,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      prompt_version: PROMPT_VERSION,
      status: "error",
      error: message,
    });
    // Notes are safe; mark FAILED so the UI can offer retry. Never a false success.
    await supabase
      .from("proposals")
      .update({ status: "FAILED", updated_at: new Date().toISOString() })
      .eq("id", proposalId);
    return { ok: false, error: message };
  }
}
