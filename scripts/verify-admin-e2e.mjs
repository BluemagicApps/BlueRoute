// Throwaway E2E harness for the /admin backend. Replicates exactly what the
// browser login form does (signInWithPassword -> @supabase/ssr cookies) and
// drives the server pages over HTTP. Run: node scripts/verify-admin-e2e.mjs
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

const BASE = "http://localhost:3000";
const EMAIL = "roberthorton2167@gmail.com";
const PASSWORD = "BlueRoute!Admin2026";

function makeJarClient() {
  const jar = new Map();
  const client = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (cs) => cs.forEach((c) => jar.set(c.name, c.value)),
      },
    },
  );
  return { client, jar };
}

const cookieHeader = (jar) =>
  [...jar].map(([n, v]) => `${n}=${v}`).join("; ");

async function get(path, jar) {
  const res = await fetch(BASE + path, {
    redirect: "manual",
    headers: jar ? { cookie: cookieHeader(jar) } : {},
  });
  const body = res.status === 200 ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location"), body };
}

function step(label, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"} | ${label}${detail ? " | " + detail : ""}`);
  if (!ok) process.exitCode = 1;
}

// --- 1. unauthenticated /admin must bounce to /admin/login -----------------
{
  const r = await get("/admin");
  step(
    "GET /admin (no cookie) redirects to /admin/login",
    [302, 303, 307, 308].includes(r.status) && r.location?.includes("/admin/login"),
    `status=${r.status} location=${r.location}`,
  );
}

// --- 2. login page renders ---------------------------------------------------
{
  const r = await get("/admin/login");
  step(
    "GET /admin/login renders sign-in form",
    r.status === 200 && r.body.includes("Admin sign in"),
    `status=${r.status}`,
  );
}

// --- 3. PROBE: wrong password rejected by Supabase --------------------------
{
  const { client } = makeJarClient();
  const { error } = await client.auth.signInWithPassword({
    email: EMAIL,
    password: "definitely-wrong",
  });
  step(
    "PROBE wrong password -> sign-in rejected",
    !!error,
    error ? `error="${error.message}"` : "NO ERROR — accepted bad password!",
  );
}

// --- 4. real login (same call the form makes) -------------------------------
const { client: authed, jar } = makeJarClient();
{
  const { data, error } = await authed.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  step(
    "signInWithPassword (form's exact call) issues session cookies",
    !error && !!data.session && jar.size > 0,
    `cookies=[${[...jar.keys()].join(", ")}]`,
  );
}

// --- 5. authenticated admin pages all render --------------------------------
const pages = [
  ["/admin", ["Dashboard"]],
  ["/admin/shipments", ["Shipments"]],
  ["/admin/admins", ["Administrators"]],
  ["/admin/settings", ["Settings"]],
  ["/admin/email", ["Email"]],
  ["/admin/ai-audit", ["AI"]],
];
for (const [path, markers] of pages) {
  const r = await get(path, jar);
  const found = markers.every((m) => r.body.includes(m));
  step(
    `GET ${path} (super admin) renders`,
    r.status === 200 && found,
    `status=${r.status}${r.status !== 200 ? " location=" + r.location : found ? "" : " markers missing: " + markers.join(",")}`,
  );
}

// --- 6. PROBE: nonexistent shipment id ---------------------------------------
{
  const r = await get("/admin/shipments/00000000-0000-0000-0000-000000000000", jar);
  step(
    "PROBE GET /admin/shipments/<bogus uuid>",
    r.status === 404 || r.location?.includes("/admin"),
    `status=${r.status} location=${r.location}`,
  );
}

// --- 7. PROBE: authenticated NON-admin user must be bounced ------------------
{
  const svc = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const tempEmail = `e2e-nonadmin-${Date.now()}@example.com`;
  const tempPass = "Temp!" + Date.now();
  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email: tempEmail,
    password: tempPass,
    email_confirm: true,
  });
  if (createErr) {
    step("PROBE non-admin user setup", false, createErr.message);
  } else {
    const { client: nonAdmin, jar: naJar } = makeJarClient();
    const { error: naErr } = await nonAdmin.auth.signInWithPassword({
      email: tempEmail,
      password: tempPass,
    });
    if (naErr) {
      step("PROBE non-admin sign-in", false, naErr.message);
    } else {
      const r = await get("/admin", naJar);
      step(
        "PROBE authed NON-admin hitting /admin gets bounced",
        r.status !== 200 ||
          (!r.body.includes("Dashboard") && r.body.includes("Admin sign in")),
        `status=${r.status} location=${r.location}`,
      );
    }
    await svc.auth.admin.deleteUser(created.user.id);
    console.log("     (temp non-admin user deleted)");
  }
}

console.log(process.exitCode ? "\nRESULT: FAIL" : "\nRESULT: ALL GREEN");
