import { supabase } from "@/lib/supabase";
import { buildProposalPdf } from "@/lib/pdf";
import type { Proposal, ProposalItem } from "@/types";

// Stream the proposal as a PDF (preview/download from the review screen).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data: p } = await supabase.from("proposals").select("*").eq("id", params.id).single();
  if (!p) return new Response("Not found", { status: 404 });
  const proposal = p as Proposal;

  const { data: contact } = await supabase
    .from("contacts")
    .select("name")
    .eq("id", proposal.contact_id)
    .maybeSingle();

  const { data: items } = await supabase
    .from("proposal_items")
    .select("*")
    .eq("proposal_id", params.id);

  const pdf = await buildProposalPdf(proposal, (items ?? []) as ProposalItem[], contact?.name ?? "Customer");

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proposal-${params.id.slice(0, 8)}.pdf"`,
    },
  });
}
