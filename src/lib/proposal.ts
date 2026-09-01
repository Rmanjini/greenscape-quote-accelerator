import type { Proposal, ProposalItem } from "@/types";

const money = (n: number | null) =>
  n == null ? "—" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

// Deterministic customer-facing proposal text assembled from stored data — no
// second LLM call, so no extra hallucination surface. Only priced, non-flagged
// items go in the base scope; flagged items are held back for Marcus.
export function formatCustomerProposal(p: Proposal, items: ProposalItem[], customer: string) {
  const priced = items.filter((i) => i.line_total != null && !i.needs_review);
  const lines = priced
    .map(
      (i) =>
        `• ${i.description} — ${i.quantity ?? ""} ${i.unit ?? ""} @ ${money(
          i.unit_price
        )} = ${money(i.line_total)}`
    )
    .join("\n");

  return [
    `Greenscape Pro — Proposal`,
    `Prepared for: ${customer}`,
    p.project_name ? `Project: ${p.project_name}` : "",
    ``,
    p.ai_summary ? `Overview:\n${p.ai_summary}` : "",
    ``,
    `Scope of Work:`,
    lines || "(pending)",
    ``,
    `Subtotal: ${money(p.subtotal)}`,
    `Total: ${money(p.total)}`,
    ``,
    p.assumptions?.length ? `Assumptions:\n${p.assumptions.map((a) => `- ${a}`).join("\n")}` : "",
    p.exclusions?.length ? `Exclusions:\n${p.exclusions.map((e) => `- ${e}`).join("\n")}` : "",
    p.potential_addons?.length
      ? `Optional Add-ons (not included):\n${p.potential_addons.map((a) => `- ${a}`).join("\n")}`
      : "",
    ``,
    `Next steps: reply to approve and we'll schedule your build.`,
  ]
    .filter((s) => s !== "")
    .join("\n");
}
