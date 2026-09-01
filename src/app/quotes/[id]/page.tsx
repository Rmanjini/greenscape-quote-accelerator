import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Proposal, ProposalItem } from "@/types";
import QuoteActions from "./QuoteActions";

export const dynamic = "force-dynamic"; // always read fresh status

const money = (n: number | null) =>
  n == null ? "—" : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const STATUS_STYLE: Record<string, string> = {
  NEEDS_REVIEW: "bg-amber-100 text-amber-800",
  READY_FOR_APPROVAL: "bg-blue-100 text-blue-800",
  APPROVED: "bg-indigo-100 text-indigo-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  DRAFT: "bg-neutral-100 text-neutral-700",
};

export default async function QuotePage({ params }: { params: { id: string } }) {
  const { data: p } = await supabase.from("proposals").select("*").eq("id", params.id).single();
  if (!p) notFound();
  const proposal = p as Proposal;

  const { data: contact } = await supabase
    .from("contacts")
    .select("name, email, phone, address")
    .eq("id", proposal.contact_id)
    .maybeSingle();

  const { data: itemRows } = await supabase
    .from("proposal_items")
    .select("*")
    .eq("proposal_id", params.id)
    .order("needs_review", { ascending: false });
  const items = (itemRows ?? []) as ProposalItem[];

  return (
    <div className="max-w-3xl">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← Dashboard
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{contact?.name ?? "Customer"}</h1>
          <p className="text-sm text-neutral-500">
            {proposal.project_name || proposal.project_type || "Proposal"}
            {contact?.email ? ` · ${contact.email}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            STATUS_STYLE[proposal.status] ?? "bg-neutral-100"
          }`}
        >
          {proposal.status.replace(/_/g, " ")}
        </span>
      </div>

      {proposal.status === "FAILED" && (
        <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          AI processing failed. Your notes are safely stored. Retry below.
        </div>
      )}

      {!contact?.email && proposal.status !== "SENT" && (
        <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ Customer email is missing — required before sending.
        </div>
      )}

      {proposal.ai_summary && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold text-neutral-700">Overview</h2>
          <p className="mt-1 text-sm text-neutral-600">{proposal.ai_summary}</p>
        </section>
      )}

      {proposal.needs_review && proposal.review_reasons?.length > 0 && (
        <section className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-800">
            ⚠️ {proposal.review_reasons.length} item(s) need attention
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {proposal.review_reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {items.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">Scope & Pricing</h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Unit price</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr
                    key={i.id}
                    className={`border-t ${i.needs_review ? "bg-amber-50" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium">{i.description}</div>
                      {i.needs_review && (
                        <div className="text-xs text-amber-700">⚠ {i.review_reason}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {i.quantity ?? "—"} {i.unit ?? ""}
                      {i.quantity_status !== "explicit" && (
                        <span className="ml-1 rounded bg-neutral-200 px-1 text-[10px] uppercase text-neutral-600">
                          {i.quantity_status}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">{money(i.unit_price)}</td>
                    <td className="px-3 py-2 font-medium">
                      {i.line_total == null ? (
                        <span className="text-amber-700">needs review</span>
                      ) : (
                        money(i.line_total)
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-neutral-500">
                      {i.confidence != null ? Math.round(i.confidence * 100) + "%" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-neutral-50 font-medium">
                <tr>
                  <td className="px-3 py-2" colSpan={3}>
                    Subtotal
                  </td>
                  <td className="px-3 py-2" colSpan={2}>
                    {money(proposal.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2" colSpan={3}>
                    Total
                  </td>
                  <td className="px-3 py-2 text-base" colSpan={2}>
                    {money(proposal.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <ListBlock title="Assumptions" items={proposal.assumptions} />
        <ListBlock title="Exclusions" items={proposal.exclusions} />
        <ListBlock title="Optional add-ons (not priced)" items={proposal.potential_addons} />
        <ListBlock title="Unknowns" items={proposal.unknowns} />
      </div>

      <div className="mt-6 border-t pt-4">
        <QuoteActions id={proposal.id} status={proposal.status} />
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h3>
      <ul className="list-disc space-y-0.5 pl-5 text-neutral-600">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
