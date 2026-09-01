import { createClient } from "@supabase/supabase-js";

// Server-only client using the service-role key. API routes own all writes;
// there is no public/browser Supabase access in v1, so no RLS policies needed.
// A single service-role client is fine for an internal tool with no end-user
// auth. Add RLS + an anon client when this is exposed beyond Marcus/Jenna.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  // Fail loud at import time in dev; on Railway the env vars must be set.
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
}

// Placeholders keep createClient from throwing at build/import when env is
// absent (route modules are evaluated during `next build`). Real values are
// injected at runtime on Railway.
export const supabase = createClient(url || "http://localhost:54321", key || "placeholder-key", {
  auth: { persistSession: false },
  // Force fresh reads. Next.js caches fetch() by default and can serve a stale
  // (even empty) response for list queries; an internal quoting dashboard must
  // always reflect the live DB. no-store opts every Supabase call out of it.
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, cache: "no-store" }),
  },
});
