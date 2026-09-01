import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const money = (n: number) => `$${Number(n).toLocaleString("en-US")}`;

const STATUS_STYLE: Record<string, string> = {
  NEEDS_REVIEW: "bg-amber-300 text-black",
  READY_FOR_APPROVAL: "bg-sky-300 text-black",
  APPROVED: "bg-indigo-300 text-black",
  SENT: "bg-lime-300 text-black",
  FAILED: "bg-red-400 text-black",
  DRAFT: "bg-neutral-200 text-black",
};

export default async function Dashboard() {
  // Resilient to a missing/unreachable DB so the shell still renders.
  const { data: rows } = await supabase
    .from("proposals")
    .select("id, total, status, created_at, contacts(name)")
    .order("created_at", { ascending: false })
    .then((r) => r, () => ({ data: [] as any[] }));
  const proposals = rows ?? [];

  const count = (s: string) => proposals.filter((p) => p.status === s).length;
  const needsAttention = count("NEEDS_REVIEW") + count("FAILED");

  const { data: runs } = await supabase
    .from("ai_runs")
    .select("latency_ms")
    .eq("status", "ok")
    .not("latency_ms", "is", null)
    .then((r) => r, () => ({ data: [] as any[] }));
  const avgMs =
    runs && runs.length
      ? Math.round(runs.reduce((s, r) => s + (r.latency_ms ?? 0), 0) / runs.length)
      : null;

  const stats = [
    { label: "Draft", value: count("DRAFT") },
    { label: "Review", value: count("NEEDS_REVIEW") + count("READY_FOR_APPROVAL") },
    { label: "Sent", value: count("SENT") },
    { label: "Needs attention", value: needsAttention },
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-4xl font-extrabold tracking-tight">{s.value}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-600">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <p className="mb-4 text-sm font-medium text-neutral-700">
        Avg AI quote-draft time:{" "}
        <span className="chip bg-lime-300 text-black">
          {avgMs != null ? `${(avgMs / 1000).toFixed(1)}s` : "—"}
        </span>{" "}
        vs. Marcus&apos;s current <span className="font-bold">6–9 days</span> by hand.
      </p>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b-2 border-black px-4 py-3">
          <h2 className="h-brutal text-base">Recent proposals</h2>
          <Link href="/quotes/new" className="text-sm font-extrabold uppercase text-brand hover:underline">
            + New Quote
          </Link>
        </div>
        {proposals.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-400">
            No proposals yet. Create your first quote.
          </p>
        ) : (
          <ul className="divide-y-2 divide-black/10">
            {proposals.map((p: any) => (
              <li key={p.id}>
                <Link
                  href={`/quotes/${p.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/50"
                >
                  <span className="font-bold">{p.contacts?.name ?? "Customer"}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-bold text-neutral-700">{money(p.total)}</span>
                    <span className={`chip ${STATUS_STYLE[p.status] ?? "bg-neutral-200 text-black"}`}>
                      {p.status.replace(/_/g, " ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
