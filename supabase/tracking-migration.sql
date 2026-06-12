-- Blue Route — tracking page coordinates (run in the Supabase SQL editor).
-- Adds origin/destination coordinates used by the public tracking map.
alter table public.shipments
  add column if not exists origin_lng numeric,
  add column if not exists origin_lat numeric,
  add column if not exists destination_lng numeric,
  add column if not exists destination_lat numeric;
