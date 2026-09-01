import { NextResponse } from "next/server";
import { approveAndSend } from "@/lib/approve";

// Human approval from the dashboard. Actor is Marcus (the reviewer).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const result = await approveAndSend(params.id, "Marcus (dashboard)");
  const status = result.ok ? 200 : result.code === "MISSING_EMAIL" ? 400 : 502;
  return NextResponse.json(result, { status });
}
