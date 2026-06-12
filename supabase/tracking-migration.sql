-- Blue Route — tracking page coordinates (run in the Supabase SQL editor).
-- Adds the ORIGIN/DESTINATION coordinates used to draw the public tracking
-- route line. (The CURRENT position columns — current_lng/current_lat — already
-- exist from admin-schema.sql; this migration completes the coordinate set.)
-- Until this runs, the map degrades to a single current-position pin and admin
-- shipment saves omit these columns (see omitNullCoords in app/actions/shipments.ts).
alter table public.shipments
  add column if not exists origin_lng numeric,
  add column if not exists origin_lat numeric,
  add column if not exists destination_lng numeric,
  add column if not exists destination_lat numeric;
