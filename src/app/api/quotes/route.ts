import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateProposal } from "@/lib/generate";

// Create a quote: persist contact + proposal, then run the AI pipeline.
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const notes = (body.site_walk_notes ?? "").toString().trim();
  const name = (body.name ?? "").toString().trim();
  if (!name) return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
  if (notes.length < 20)
    return NextResponse.json({ error: "Site-walk notes are too short to quote" }, { status: 400 });

  const { data: contact, error: cErr } = await supabase
    .from("contacts")
    .insert({
      name,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      ghl_contact_id: body.ghl_contact_id || null,
    })
    .select("id")
    .single();
  if (cErr || !contact)
    return NextResponse.json({ error: "Could not save customer" }, { status: 500 });

  const { data: proposal, error: prErr } = await supabase
    .from("proposals")
    .insert({
      contact_id: contact.id,
      project_name: body.project_name || null,
      address: body.address || null,
      site_walk_notes: notes,
      status: "DRAFT",
    })
    .select("id")
    .single();
  if (prErr || !proposal)
    return NextResponse.json({ error: "Could not save proposal" }, { status: 500 });

  const gen = await generateProposal(proposal.id);
  // Even on AI failure we return the id (notes are saved; UI offers retry).
  return NextResponse.json({ id: proposal.id, ...gen });
}
