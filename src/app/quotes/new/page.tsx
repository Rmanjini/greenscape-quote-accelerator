"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_NOTES = `Customer wants to completely replace backyard.
Existing grass approximately 600 sqft - wants artificial turf.
12x14 covered pergola against back wall.
Large paver patio underneath (didn't measure, guessing ~400 sqft).
Fire pit in the center.
Customer mentioned possibly adding an outdoor kitchen later.
Existing irrigation needs to be checked.
Wants it done before Thanksgiving. Budget discussed around $30-40k.`;

export default function NewQuote() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    project_name: "",
    site_walk_notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/quotes/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const input = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold">New Quote</h1>
      <p className="mb-5 text-sm text-neutral-500">
        Paste the site-walk notes. AI drafts a review-ready proposal; you approve it.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Customer name *</label>
            <input className={input} value={form.name} onChange={set("name")} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Email</label>
            <input className={input} type="email" value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Phone</label>
            <input className={input} value={form.phone} onChange={set("phone")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Project name</label>
            <input className={input} value={form.project_name} onChange={set("project_name")} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Address</label>
          <input className={input} value={form.address} onChange={set("address")} />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-600">Site-walk notes *</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, name: form.name || "Sarah Johnson", email: form.email || "sarah@example.com", site_walk_notes: DEMO_NOTES })}
              className="text-xs text-brand underline"
            >
              Load demo notes
            </button>
          </div>
          <textarea
            className={`${input} h-48 font-mono text-xs`}
            value={form.site_walk_notes}
            onChange={set("site_walk_notes")}
            placeholder="e.g. Customer wants artificial turf, ~600 sqft. 12x14 pergola..."
            required
          />
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          disabled={submitting}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Analyzing notes…" : "Generate proposal"}
        </button>
      </form>
    </div>
  );
}
