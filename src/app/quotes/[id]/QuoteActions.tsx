"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuoteActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function post(path: string, okText: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMsg({ kind: "ok", text: data.already ? "Already sent." : okText });
      router.refresh();
    } catch (e: any) {
      setMsg({ kind: "err", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const sent = status === "SENT";
  const failed = status === "FAILED";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {failed && (
          <button
            onClick={() => post(`/api/quotes/${id}/generate`, "Regenerated.")}
            disabled={busy}
            className="rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Retrying…" : "Retry AI"}
          </button>
        )}
        {!sent && !failed && (
          <button
            onClick={() => post(`/api/quotes/${id}/approve`, "Approved & sent to customer.")}
            disabled={busy}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Sending…" : "✅ Approve & Send"}
          </button>
        )}
        {sent && (
          <span className="rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
            Sent to customer ✓
          </span>
        )}
      </div>
      {msg && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            msg.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
