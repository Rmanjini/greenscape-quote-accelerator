-- Greenscape Pro Quote Accelerator - schema
-- Run in the Supabase SQL editor (or psql). Idempotent-ish: drops are commented out.
-- v1 folds "projects" into "proposals" (one proposal per site walk).

create extension if not exists pgcrypto;

-- Customers / GHL contacts -------------------------------------------------
create table if not exists contacts (
  id             uuid primary key default gen_random_uuid(),
  ghl_contact_id text,
  name           text not null,
  email          text,
  phone          text,
  address        text,
  created_at     timestamptz not null default now()
);

-- Priced catalog: the ONLY source of truth for money -----------------------
create table if not exists pricing_items (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique not null,
  name        text not null,
  description text,
  category    text,
  unit        text not null,               -- sqft | each | linear_ft | lump_sum
  unit_price  numeric(12,2) not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Proposals ----------------------------------------------------------------
-- status lifecycle: DRAFT -> AI_GENERATED -> NEEDS_REVIEW ->
--                   READY_FOR_APPROVAL -> APPROVED -> SENT
create table if not exists proposals (
  id                  uuid primary key default gen_random_uuid(),
  contact_id          uuid references contacts(id) on delete set null,
  project_name        text,
  address             text,
  site_walk_notes     text not null,
  status              text not null default 'DRAFT'
                      check (status in ('DRAFT','AI_GENERATED','NEEDS_REVIEW',
                                        'READY_FOR_APPROVAL','APPROVED','SENT','FAILED')),
  project_type        text,
  ai_summary          text,
  assumptions         jsonb not null default '[]',
  exclusions          jsonb not null default '[]',
  potential_addons    jsonb not null default '[]',
  unknowns            jsonb not null default '[]',
  needs_review        boolean not null default false,
  review_reasons      jsonb not null default '[]',
  subtotal            numeric(12,2) not null default 0,
  discount            numeric(12,2) not null default 0,
  total               numeric(12,2) not null default 0,
  approved_by         text,
  approved_at         timestamptz,
  sent_at             timestamptz,
  telegram_message_id text,
  ghl_message_id      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Line items. unit_price/line_total stay NULL until a confident catalog match
create table if not exists proposal_items (
  id               uuid primary key default gen_random_uuid(),
  proposal_id      uuid not null references proposals(id) on delete cascade,
  pricing_item_id  uuid references pricing_items(id) on delete set null,
  description      text not null,
  quantity         numeric(12,2),
  quantity_status  text not null default 'explicit'
                   check (quantity_status in ('explicit','derived','inferred','unknown')),
  unit             text,
  unit_price       numeric(12,2),
  line_total       numeric(12,2),
  confidence       numeric(3,2),           -- scope-extraction confidence 0..1
  match_confidence numeric(3,2),           -- catalog-match confidence 0..1
  source_text      text,                   -- the note snippet this came from
  needs_review     boolean not null default false,
  review_reason    text,
  created_at       timestamptz not null default now()
);

-- Every LLM call, for cost + traceability ----------------------------------
create table if not exists ai_runs (
  id             uuid primary key default gen_random_uuid(),
  proposal_id    uuid references proposals(id) on delete cascade,
  model          text,
  prompt_version text,
  input_tokens   int,
  output_tokens  int,
  latency_ms     int,
  status         text,                     -- ok | error
  error          text,
  created_at     timestamptz not null default now()
);

-- Who did what, when (approve/send/etc.) -----------------------------------
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id) on delete cascade,
  actor       text,
  action      text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists proposals_status_idx on proposals(status);
create index if not exists proposal_items_proposal_idx on proposal_items(proposal_id);
