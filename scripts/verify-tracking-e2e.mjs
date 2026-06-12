// Live E2E for the public tracking rebuild. Seeds/refreshes a demo shipment
// (BRL-TEST0001) with backdated events, then drives /api/track and /tracking.
// Adaptive: detects whether tracking-migration.sql (origin/destination coords)
// has been applied. Without it, the map degrades to a single current-position
// pin and the route-line assertions are reported as PENDING (not failures);
// re-run after applying the migration to confirm the full route.
//   Run with the dev server up:  node scripts/verify-tracking-e2e.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const BASE = "http://localhost:3000";
const TN = "BRL-TEST0001";

function step(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${label}${detail ? " | " + detail : ""}`);
  if (!ok) process.exitCode = 1;
}
function pending(label, detail = "") {
  console.log(`PEND | ${label}${detail ? " | " + detail : ""}`);
}

// 0. detect migration (origin_lng column present?)
let migrated = true;
{
  const { error } = await svc.from("shipments").select("origin_lng").limit(1);
  if (error) {
    migrated = false;
    console.log(
      "NOTE: tracking-migration.sql NOT applied — origin/destination coords absent.",
    );
    console.log(
      "      Full route line is PENDING. Apply supabase/tracking-migration.sql in the",
    );
    console.log(
      "      Supabase SQL editor, then re-run this script to verify the route map.\n",
    );
  }
}

// 1. seed demo shipment + events
const baseRow = {
  tracking_number: TN,
  receiver_name: "Graham Buckley",
  receiver_email: "graham@example.com",
  receiver_phone: "+1 (805) 891-0000",
  receiver_address: "Ridgeway Drive, Glendale, CA",
  receiver_country: "United States",
  sender_name: "Liebherr International",
  sender_email: "info@example.com",
  sender_phone: "+49 8273 000",
  sender_address: "Biberach an der Riß",
  sender_country: "Germany",
  origin: "Hamburg port, Germany",
  destination: "Phnom Penh, Cambodia",
  freight_type: "Sea Freight",
  content_type: "Container",
  weight_kg: 150961.43,
  qty: 1,
  description: "Crane parts",
  status: "On Hold",
  date_shipped: "2026-05-12",
  expected_delivery: "2026-06-30",
  current_location: "Varna port, Varna",
  current_city: "Varna",
  current_lng: 27.9147,
  current_lat: 43.1996,
  shipment_cost: 25000,
  clearance_cost: 1200,
  delivery_pct: 59,
  notice:
    "Urgent attention needed: shipment is on hold at Varna port, Bulgaria. Please contact customer support immediately.",
};
const shipmentRow = migrated
  ? {
      ...baseRow,
      origin_lng: 9.9937,
      origin_lat: 53.5511,
      destination_lng: 104.9282,
      destination_lat: 11.5564,
    }
  : baseRow;

const { data: up, error: upErr } = await svc
  .from("shipments")
  .upsert(shipmentRow, { onConflict: "tracking_number" })
  .select("id")
  .single();
step("seed demo shipment", !upErr, upErr?.message ?? `id=${up?.id}`);
if (upErr) {
  console.log("\nRESULT: FAIL (could not seed)");
  process.exit(1);
}

await svc.from("shipment_events").delete().eq("shipment_id", up.id);
const events = [
  { status: "Pending", location: "Hamburg port", country: "Germany", occurred_at: "2026-05-12T15:32:00Z", comment: "Vessel sorted at Hamburg terminal" },
  { status: "On route", location: "Mersin port", country: "Turkey", occurred_at: "2026-06-03T12:38:00Z", comment: "Shipment docked at Mersin port" },
  { status: "On Hold", location: "Varna port", country: "Bulgaria", occurred_at: "2026-06-07T10:25:00Z", comment: "Shipment is on hold at Varna port" },
].map((e) => ({ ...e, shipment_id: up.id }));
const { error: evErr } = await svc.from("shipment_events").insert(events);
step("seed backdated events", !evErr, evErr?.message ?? "3 events");

// 2. API positive path
{
  const res = await fetch(`${BASE}/api/track/${TN}`);
  const body = await res.json();
  step("GET /api/track/<demo> 200", res.status === 200, `status=${res.status}`);
  step(
    "payload: consignment + parties + costs",
    body?.consignment?.trackingNumber === TN &&
      body?.receiver?.name === "Graham Buckley" &&
      body?.consignment?.shipmentCost === 25000,
  );
  step("payload: current map point resolved", body?.map?.current?.name === "Varna");
  step(
    "payload: events newest first (3)",
    body?.events?.[0]?.status === "On Hold" && body?.events?.length === 3,
  );
  step("payload: no internal id leak", !JSON.stringify(body).includes(up.id));
  if (migrated) {
    step(
      "payload: origin/destination map points resolved",
      body?.map?.origin?.lat === 53.5511 && body?.map?.destination?.lng === 104.9282,
    );
  } else {
    pending("payload: origin/destination map points", "needs migration");
    step("payload: origin/destination null pre-migration", body?.map?.origin === null);
  }
}

// 3. case-insensitive lookup
{
  const res = await fetch(`${BASE}/api/track/${TN.toLowerCase()}`);
  step("PROBE lowercase tracking number still resolves", res.status === 200);
}

// 4. 404
{
  const res = await fetch(`${BASE}/api/track/BRL-NOPE9999`);
  step("PROBE bogus number -> 404", res.status === 404);
}

// 5. page renders the shell for ?ref=
{
  const res = await fetch(`${BASE}/tracking?ref=${TN}`);
  const html = await res.text();
  step("GET /tracking?ref=<demo> 200 + shell", res.status === 200 && html.includes("Track your"));
}

// 6. rate limit (limit is 20/60s per IP)
{
  let last = 200;
  for (let i = 0; i < 25; i++) {
    const res = await fetch(`${BASE}/api/track/BRL-NOPE9999`);
    last = res.status;
  }
  step("PROBE burst of 25 -> 429", last === 429, `last=${last}`);
}

console.log(
  process.exitCode
    ? "\nRESULT: FAIL"
    : migrated
      ? "\nRESULT: ALL GREEN (migration applied — full route verified)"
      : "\nRESULT: GREEN (core verified; route-line PENDING migration)",
);
