# Greenscape Pro — Quote Accelerator

Turns messy **site-walk notes → a review-ready proposal** the same day, instead of the 6–9 days Marcus spends building each one by hand. **AI prepares, Marcus approves.** This is the P0 agent from [`STRATEGY.md`](./STRATEGY.md).

**Live:** _add Railway URL here_ · **Strategy doc:** [`STRATEGY.md`](./STRATEGY.md)

---

## The one architectural decision that matters

**The model never owns the price.**

```
site-walk notes
   │  (OpenAI, structured output)
   ▼
scope items + quantities + best-match SKU + confidence     ← the LLM stops here
   │  (application code, deterministic)
   ▼
look up unit_price from Postgres catalog → quantity × price → totals
```

The LLM only *identifies* scope and maps it to a catalog SKU. It is given the
catalog **without prices** and literally cannot return money. The application
looks up the authoritative unit price from Supabase and does the arithmetic. If
the model can't confidently match a SKU, or a quantity is missing/inferred, the
line gets `needs_review = true` and **no price is assigned** — the quote stops
and asks for a human instead of hallucinating a number.

That's the answer to *"how do you stop the AI hallucinating a price?"* — it never
had the price to hallucinate.

## How it works (end-to-end)

1. Marcus pastes site-walk notes (`/quotes/new`).
2. `extractScope` (OpenAI structured output) returns scope items, quantities,
   units, confidence, and a matched SKU per item. Hallucinated SKUs are dropped
   in code before anything is priced.
3. `computePricing` (pure, deterministic) prices matched items from the DB and
   flags the rest.
4. Proposal + line items are persisted to Supabase; the LLM call is logged to
   `ai_runs` (tokens, latency) for cost + audit.
5. Marcus gets a **Telegram** ping: total, flags, and inline **Approve & Send**.
6. On approval, the proposal goes to the customer via the **GHL adapter**, status
   flips to `SENT`, and every step is written to `audit_logs`.

## Guardrails

- **No invented prices** — model never sees prices; unmatched item → `null` price + review flag.
- **No invented quantities** — inferred/missing quantity → flagged (`quantity_status`).
- **No hallucinated SKUs** — every SKU is validated against the catalog server-side.
- **Human-in-the-loop** — nothing reaches a customer without an explicit Approve.
- **No double-send** — approval is idempotent; an already-`SENT` quote won't resend.
- **No false success** — if the send fails, status stays `APPROVED`, never `SENT`.
- **No auto-discount** — discount is always 0 unless a human sets it.
- **Bad AI output** — invalid JSON / API failure → proposal marked `FAILED`, notes
  preserved, one-click **Retry**.

## Stack & why

| Layer | Choice | Why |
|------|--------|-----|
| App | Next.js (App Router) | One deployable for UI + API routes |
| DB | Supabase (Postgres) | Real relational store; SQL catalog is the pricing source of truth |
| LLM | OpenAI structured outputs | Strict JSON schema = reliable extraction, no prose parsing |
| Notify/approve | Telegram Bot | Marcus lives on his phone; inline approve = "I just look and approve" |
| Send | GoHighLevel adapter | Client's system of record; mock mode until creds are provided |
| Deploy | Railway | Simple Next.js hosting from GitHub |

### Model choice & cost

Default `OPENAI_MODEL=gpt-4o-mini`. One quote ≈ ~1.5K input + ~800 output tokens
≈ **~$0.001 per quote** — negligible at ~150 quotes/year. Bump to `gpt-4o` (env
var, no code change) for maximum match accuracy at ~1–2¢/quote if edge cases warrant.

## Run it locally

```bash
npm install
cp .env.example .env        # fill in the values (see below)
# In Supabase SQL editor: run supabase/schema.sql then supabase/seed.sql
npm run dev                 # http://localhost:3000
```

Money-math self-check: `npx tsx src/lib/pricing.check.ts`

## Deploy (Railway)

1. Create a Railway project → **Deploy from GitHub repo** → this repo.
2. Add all env vars from `.env.example`.
3. Railway builds with `npm run build` and starts with `npm start` (binds `$PORT`).
4. Set `NEXT_PUBLIC_APP_URL` to the Railway URL.

### Wire up Telegram (2 min)

1. Create a bot with [@BotFather](https://t.me/botfather) → `TELEGRAM_BOT_TOKEN`.
2. Message your bot, then get your chat id from [@userinfobot](https://t.me/userinfobot) → `TELEGRAM_CHAT_ID`.
3. Register the inline-button webhook (so Approve works from Telegram):

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram/webhook?secret=<TELEGRAM_WEBHOOK_SECRET>"
```

Telegram is optional — if unset, the app still works (notifications are skipped, approve via the dashboard).

## What I'd do next (scope cut for 24h)

- Editable line items in the review UI (today Marcus retries or edits in GHL).
- Real GHL API send (adapter is ready; needs client creds).
- Row-level security + real auth (v1 is a single-tenant internal tool).
- Separate `projects` from `proposals` and add multi-version quotes.
- Agent #2 from the strategy doc: closed-lost reactivation.
