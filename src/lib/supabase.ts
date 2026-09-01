import { createClient } from "@supabase/supabase-js";

// Server-only client using the service-role key. API routes own all writes;
// there is no public/browser Supabase access in v1, so no RLS policies needed.
// ponytail: single service-role client is fine here — internal tool, no end-user
// auth. Add RLS + anon client when this is exposed beyond Marcus/Jenna.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  // Fail loud at import time in dev; on Railway the env vars must be set.
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
}

export const supabase = createClient(url ?? "", key ?? "", {
  auth: { persistSession: false },
});
