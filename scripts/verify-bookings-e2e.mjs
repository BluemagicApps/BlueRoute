// Live E2E for warehouse bookings. Seeds a booking via the service role (mirroring
// submitWarehouseBooking's insert), verifies the authed /admin/bookings page renders
// it, flips status, checks the filter, and the public page 200/404. Cleans up.
//   node scripts/verify-bookings-e2e.mjs   (dev server must be up)
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const BASE = "http://localhost:3000";
const EMAIL = "roberthorton2167@gmail.com";
const PASSWORD = "BlueRoute!Admin2026";
const REF = "BR-WH-99999";

const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function step(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${label}${detail ? " | " + detail : ""}`);
  if (!ok) process.exitCode = 1;
}
function makeJar() {
  const jar = new Map();
  const client = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach((c) => jar.set(c.name, c.value)) },
  });
  return { client, jar };
}
const cookieHeader = (jar) => [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
async function get(path, jar) {
  const res = await fetch(BASE + path, { redirect: "manual", headers: jar ? { cookie: cookieHeader(jar) } : {} });
  return { status: res.status, body: res.status === 200 ? await res.text() : "", location: res.headers.get("location") };
}

// clean any prior seed
await svc.from("bookings").delete().eq("booking_ref", REF);

// 1. seed a booking (shape submitWarehouseBooking writes)
{
  const { error } = await svc.from("bookings").insert({
    type: "warehouse", warehouse_id: "rtm-a", name: "E2E Tester", email: "e2e@example.com",
    phone: "+1 555", company: "E2E Co", status: "new", booking_ref: REF,
    details: { facilityName: "Rotterdam Smart Hub A", city: "Rotterdam", country: "Netherlands", sqftRequested: 20000, moveIn: "2026-09-01", termMonths: 24, features: ["Cross-dock"], message: "hi" },
  });
  step("seed booking row", !error, error?.message ?? REF);
}

// 2. admin auth
const { client: authed, jar } = makeJar();
{
  const { data, error } = await authed.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  step("admin sign-in", !error && !!data.session && jar.size > 0, error?.message ?? "");
}

// 3. /admin/bookings renders the row
{
  const r = await get("/admin/bookings", jar);
  step("GET /admin/bookings shows seed", r.status === 200 && r.body.includes(REF) && r.body.includes("Rotterdam Smart Hub A"), `status=${r.status}`);
}

// 4. flip to approved via service role, page reflects it
{
  await svc.from("bookings").update({ status: "approved" }).eq("booking_ref", REF);
  const r = await get("/admin/bookings?status=approved", jar);
  step("approved filter includes the row", r.status === 200 && r.body.includes(REF));
  const rn = await get("/admin/bookings?status=new", jar);
  step("new filter excludes the approved row", rn.status === 200 && !rn.body.includes(REF));
}

// 5. public page 200 / 404
{
  const ok = await get("/warehousing/book?facility=rtm-a");
  const bad = await get("/warehousing/book?facility=bogus");
  step("public booking page 200 for real facility", ok.status === 200);
  step("public booking page 404 for bogus facility", bad.status === 404);
}

// cleanup
await svc.from("bookings").delete().eq("booking_ref", REF);
console.log(process.exitCode ? "\nRESULT: FAIL" : "\nRESULT: ALL GREEN");
