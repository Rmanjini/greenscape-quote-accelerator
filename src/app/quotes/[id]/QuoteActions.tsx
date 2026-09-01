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
            className="btn btn-dark"
          >
            {busy ? "Retrying..." : "Retry AI"}
          </button>
        )}
        {!sent && !failed && (
          <button
            onClick={() => post(`/api/quotes/${id}/approve`, "Approved & sent to customer.")}
            disabled={busy}
            className="btn"
          >
            {busy ? "Sending..." : "✅ Approve & Send"}
          </button>
        )}
        {sent && <span className="chip bg-lime-300 text-black">Sent to customer ✓</span>}
      </div>
      {msg && (
        <p
          className={`rounded-lg border-2 border-black px-3 py-2 text-sm font-bold ${
            msg.kind === "ok" ? "bg-lime-300 text-black" : "bg-red-300 text-black"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
