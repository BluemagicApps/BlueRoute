// Live E2E for service quote requests. Seeds a type='service' booking via the service role
// (mirroring submitServiceQuote's insert), verifies the authed /admin/bookings page renders it
// with its summary, and the public /quote routing (service wizard 200, bogus falls back 200).
//   node scripts/verify-service-quotes-e2e.mjs   (dev server must be up)
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
const REF = "BR-SV-99999";
const SUMMARY = "Shanghai (PVG) · Los Angeles (LAX) · Express";

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

// 1. seed a service-quote booking (shape submitServiceQuote writes)
{
  const { error } = await svc.from("bookings").insert({
    type: "service", service_slug: "air-freight", name: "E2E Tester", email: "e2e@example.com",
    phone: "+1 555", company: "E2E Co", status: "new", booking_ref: REF,
    details: { service: "Air freight quote", origin: "Shanghai (PVG)", destination: "Los Angeles (LAX)", serviceLevel: "Express", weightKg: "1200", summary: SUMMARY },
  });
  step("seed service booking row", !error, error?.message ?? REF);
}

// 2. admin auth
const { client: authed, jar } = makeJar();
{
  const { data, error } = await authed.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  step("admin sign-in", !error && !!data.session && jar.size > 0, error?.message ?? "");
}

// 3. /admin/bookings renders the row + its summary
{
  const r = await get("/admin/bookings", jar);
  step("GET /admin/bookings shows service seed", r.status === 200 && r.body.includes(REF) && r.body.includes(SUMMARY), `status=${r.status}`);
}

// 4. service filter (status=new) includes it
{
  const r = await get("/admin/bookings?status=new", jar);
  step("new filter includes the service row", r.status === 200 && r.body.includes(REF));
}

// 5. public /quote routing
{
  const ocean = await get("/quote");
  const air = await get("/quote?service=air-freight");
  const bogus = await get("/quote?service=bogus");
  step("plain /quote 200 (ocean wizard)", ocean.status === 200);
  step("/quote?service=air-freight 200 (service wizard)", air.status === 200 && air.body.includes("Shipment"));
  step("/quote?service=bogus 200 (falls back)", bogus.status === 200);
}

// cleanup
await svc.from("bookings").delete().eq("booking_ref", REF);
console.log(process.exitCode ? "\nRESULT: FAIL" : "\nRESULT: ALL GREEN");
