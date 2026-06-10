-- Blue Route Logistics — lead capture schema.
-- RLS is enabled with no public policies; only the service-role key (used
-- server-side) can read/write these tables.

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  email text not null,
  topic text,
  message text not null,
  ticket_ref text not null,
  status text not null default 'new',
  user_agent text
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text,
  origin_code text,
  origin_label text,
  dest_code text,
  dest_label text,
  mode text,
  container_id text,
  container_label text,
  weight_kg numeric,
  ready_date date,
  option_id text,
  option_name text,
  transit_days int,
  co2_kg numeric,
  price_usd numeric,
  insurance boolean,
  insurance_fee_usd numeric,
  total_usd numeric,
  booking_ref text not null,
  status text not null default 'new'
);

alter table public.contact_inquiries enable row level security;
alter table public.quote_requests enable row level security;
-- No policies created => no anon/auth access. Service role bypasses RLS.
