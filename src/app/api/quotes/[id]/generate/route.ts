import { NextResponse } from "next/server";
import { generateProposal } from "@/lib/generate";

// Retry the AI pipeline for an existing proposal (used by the "Retry" button
// after an LLM failure).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const gen = await generateProposal(params.id);
  const status = gen.ok ? 200 : 502;
  return NextResponse.json(gen, { status });
}
