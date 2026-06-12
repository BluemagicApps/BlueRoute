-- Blue Route — admin backend schema (run AFTER schema.sql, in Supabase SQL editor).
-- Same security posture as schema.sql: RLS on, no public policies; only the
-- service-role key (server-side) reads/writes.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  role text not null default 'manager' check (role in ('super_admin','manager')),
  menus text[] not null default '{}',          -- menu keys this admin may open
  status text not null default 'active' check (status in ('active','disabled'))
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tracking_number text not null unique,
  -- recipient
  receiver_name text not null,
  receiver_email text,
  receiver_phone text,
  receiver_address text,
  receiver_country text,
  -- sender
  sender_name text not null,
  sender_email text,
  sender_phone text,
  sender_address text,
  sender_country text,
  -- shipping
  origin text not null,
  destination text not null,
  freight_type text not null default 'Sea Freight'
    check (freight_type in ('Sea Freight','Air Freight','Land Freight')),
  content_type text,
  weight_kg numeric,
  qty int,
  description text,
  status text not null default 'Pending'
    check (status in ('Pending','Approved','In Transit','On Hold','Customs','Out for Delivery','Delivered')),
  date_shipped date,
  expected_delivery date,
  current_location text,
  current_city text,           -- shown on the map
  current_lng numeric,
  current_lat numeric,
  shipment_cost numeric,
  clearance_cost numeric,
  delivery_pct int not null default 0 check (delivery_pct between 0 and 100),
  photo_url text,
  notice text                  -- urgent banner on the public tracking page
);

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  created_at timestamptz not null default now(),
  occurred_at timestamptz not null default now(),  -- editable => backdating
  status text not null,
  location text not null,
  country text,
  comment text
);
create index if not exists shipment_events_by_shipment
  on public.shipment_events (shipment_id, occurred_at desc);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('warehouse','service')),
  service_slug text,
  warehouse_id text,
  name text not null,
  email text not null,
  phone text,
  company text,
  details jsonb not null default '{}'::jsonb,      -- absorbs future data points
  status text not null default 'new'
    check (status in ('new','approved','rejected','closed')),
  booking_ref text not null
);

create table if not exists public.ai_interactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  question text not null,
  answer text,
  cta_path text,
  model text,
  duration_ms int,
  ok boolean not null default true
);

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists shipments_touch on public.shipments;
create trigger shipments_touch before update on public.shipments
  for each row execute function public.touch_updated_at();

alter table public.admins enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.bookings enable row level security;
alter table public.ai_interactions enable row level security;
alter table public.app_settings enable row level security;
-- No policies => service role only.

-- Storage bucket for shipment photos (public read, service-role write).
insert into storage.buckets (id, name, public)
  values ('shipment-photos','shipment-photos', true)
  on conflict (id) do nothing;
