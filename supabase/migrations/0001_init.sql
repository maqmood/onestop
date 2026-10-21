-- 0001_init.sql — provenance-first schema (ADR-0001), portable Postgres only (ADR-0003).
--
-- Conventions
--   * uuid primary keys, timestamptz in UTC, money in integer minor units (fils).
--   * Logs store hashes of VIN and IP, never raw values (CLAUDE.md non-negotiable 4).
--   * RLS is enabled on every table with no policies: anon/authenticated roles get nothing.
--     All access is server-side through the service connection.
--   * Nothing in this schema stores an image, a name, a phone number, or card data.

create extension if not exists citext;

create type source_kind as enum ('official', 'licensed', 'trial', 'unverified');

create type record_type as enum (
  'decode',         -- NHTSA vPIC decode
  'recall',         -- NHTSA recall
  'title',          -- title record (state, date)
  'brand',          -- title brand (salvage, rebuilt, flood, etc.)
  'odometer',       -- odometer reading with date
  'jsi_event',      -- NMVTIS junk/salvage/insurance event (reporting entity, disposition, export flag)
  'theft',
  'lien',
  'auction_sale',   -- auction appearance/sale record (vendor)
  'auction_photo',  -- auction photo reference (vendor); renders only if source allows
  'other'
);

create type order_status as enum (
  'pending', 'paid', 'generating', 'delivered', 'failed', 'refunded'
);

-- ---------------------------------------------------------------------------
-- Sources: one row per data provider or feed. The display gate lives here.
-- ---------------------------------------------------------------------------
create table sources (
  id               uuid primary key default gen_random_uuid(),
  key              text not null unique,          -- machine key, e.g. 'nhtsa_vpic'
  name             text not null,                 -- display name used in attribution
  kind             source_kind not null,
  licence_ref      text,                          -- contract reference; null until signed
  attribution_text text,                          -- exact credit line required by the licence
  display_allowed  boolean not null default false,-- GATE: nothing renders unless true
  allowed_uses     jsonb not null default '{}'::jsonb, -- e.g. {"cache_days": 0, "share_links": false}
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Source records: every fact we fetched, with lineage. Payload is normalised
-- provider output and must never contain personal data.
-- ---------------------------------------------------------------------------
create table source_records (
  id               uuid primary key default gen_random_uuid(),
  vin              char(17) not null,
  source_id        uuid not null references sources(id),
  record_type      record_type not null,
  payload          jsonb not null,
  external_ref     text,                          -- provider's id/receipt, for disputes
  fetched_at       timestamptz not null default now(),
  licence_verified boolean not null default false,
  retention_until  timestamptz,                   -- null = lives with the report; cron purges past this
  created_at       timestamptz not null default now()
);
create index source_records_vin_idx on source_records (vin, source_id, record_type);
create index source_records_retention_idx on source_records (retention_until)
  where retention_until is not null;

-- ---------------------------------------------------------------------------
-- Customers: email is the only identity field.
-- ---------------------------------------------------------------------------
create table customers (
  id               uuid primary key default gen_random_uuid(),
  email            citext not null unique,
  marketing_opt_in boolean not null default false,
  created_at       timestamptz not null default now()
);

create table consent_log (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid references customers(id) on delete cascade,
  consent_type     text not null,                 -- 'terms' | 'privacy' | 'marketing'
  document_version text not null,                -- version string of the document shown
  granted          boolean not null,
  ip_hash          text,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders: kept for tax record retention even after a customer deletion
-- (customer_id becomes null). amount_minor is the VAT-inclusive total.
-- ---------------------------------------------------------------------------
create table orders (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid references customers(id) on delete set null,
  vin                char(17) not null,
  status             order_status not null default 'pending',
  amount_minor       integer not null default 0,  -- 0 during the free beta
  vat_minor          integer not null default 0,
  currency           char(3) not null default 'AED',
  gateway            text,
  gateway_payment_id text unique,
  invoice_no         text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reports: what the customer actually saw, with the sources panel as data.
-- ---------------------------------------------------------------------------
create table reports (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid references orders(id) on delete set null, -- null for free reports
  vin                 char(17) not null,
  generated_at        timestamptz not null default now(),
  sources_checked     jsonb not null default '[]'::jsonb, -- [{source_key, fetched_at}]
  sources_not_checked jsonb not null default '[]'::jsonb, -- [{name, reason, link}] incl. UAE sources
  sources_errored     jsonb not null default '[]'::jsonb, -- [{source_key, error_class}]
  template_version    text not null,
  expires_at          timestamptz not null              -- access window; cron purges after
);

create table report_records (
  report_id        uuid references reports(id) on delete cascade,
  source_record_id uuid references source_records(id) on delete restrict,
  primary key (report_id, source_record_id)
);

create table share_tokens (
  token_hash  text primary key,                  -- sha256 of the random token; plaintext never stored
  report_id   uuid not null references reports(id) on delete cascade,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Operational logs: hashed identifiers only, short retention.
-- ---------------------------------------------------------------------------
create table precheck_log (
  id           bigint generated always as identity primary key,
  vin_hash     text not null,
  ip_hash      text not null,
  result_class text not null,                    -- 'invalid' | 'no_us_records' | 'records_found' | 'error'
  created_at   timestamptz not null default now()
);
create index precheck_log_created_idx on precheck_log (created_at);

create table provider_calls (
  id         bigint generated always as identity primary key,
  source_id  uuid references sources(id),
  vin_hash   text not null,
  status     text not null,                      -- 'ok' | 'no_records' | 'error'
  cost_minor integer,                            -- what the call cost us, for unit economics
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table deletion_requests (
  id           uuid primary key default gen_random_uuid(),
  email_hash   text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  notes        text
);

-- ---------------------------------------------------------------------------
-- RLS: deny by default. No policies are created on purpose.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seed: official sources render immediately; everything else stays gated
-- until a contract reference is recorded and display_allowed is flipped.
-- ---------------------------------------------------------------------------
insert into sources (key, name, kind, display_allowed, attribution_text, allowed_uses) values
  ('nhtsa_vpic',      'NHTSA vPIC vehicle decode',    'official',   true,  'Source: U.S. NHTSA vPIC',    '{"cache_days": 365}'),
  ('nhtsa_recalls',   'NHTSA recalls',                'official',   true,  'Source: U.S. NHTSA recalls', '{"cache_days": 7}'),
  ('nmvtis_reseller', 'NMVTIS via approved reseller', 'trial',      false, null,                         '{"cache_days": 0}'),
  ('auction_vendor',  'US auction history (vendor TBD)', 'unverified', false, null,                      '{"cache_days": 0, "share_links": false}');
