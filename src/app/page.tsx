import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const money = (n: number) => `$${Number(n).toLocaleString("en-US")}`;

const STATUS_STYLE: Record<string, string> = {
  NEEDS_REVIEW: "bg-amber-100 text-amber-800",
  READY_FOR_APPROVAL: "bg-blue-100 text-blue-800",
  APPROVED: "bg-indigo-100 text-indigo-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  DRAFT: "bg-neutral-100 text-neutral-700",
};

export default async function Dashboard() {
  const { data: rows } = await supabase
    .from("proposals")
    .select("id, total, status, created_at, contacts(name)")
    .order("created_at", { ascending: false });
  const proposals = rows ?? [];

  const count = (s: string) => proposals.filter((p) => p.status === s).length;
  const needsAttention = count("NEEDS_REVIEW") + count("FAILED");

  const { data: runs } = await supabase
    .from("ai_runs")
    .select("latency_ms")
    .eq("status", "ok")
    .not("latency_ms", "is", null);
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
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4">
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="text-xs text-neutral-500">{s.label}</div>
          </div>
        ))}
      </div>

      <p className="mb-4 text-sm text-neutral-500">
        Avg AI quote-draft time:{" "}
        <span className="font-medium text-neutral-700">
          {avgMs != null ? `${(avgMs / 1000).toFixed(1)}s` : "—"}
        </span>{" "}
        · vs. Marcus&apos;s current 6–9 days by hand.
      </p>

      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Recent proposals</h2>
          <Link href="/quotes/new" className="text-sm font-medium text-brand hover:underline">
            + New Quote
          </Link>
        </div>
        {proposals.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-400">
            No proposals yet. Create your first quote.
          </p>
        ) : (
          <ul className="divide-y">
            {proposals.map((p: any) => (
              <li key={p.id}>
                <Link
                  href={`/quotes/${p.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                >
                  <span className="font-medium">{p.contacts?.name ?? "Customer"}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm text-neutral-600">{money(p.total)}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLE[p.status] ?? "bg-neutral-100"
                      }`}
                    >
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
