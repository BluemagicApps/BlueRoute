// Seeds (or repairs) the first super admin. Run AFTER supabase/admin-schema.sql.
//   node scripts/seed-admin.mjs [email] [password]
// Defaults: roberthorton2167@gmail.com + a generated password (printed once).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = (process.argv[2] ?? "roberthorton2167@gmail.com").toLowerCase();
const password = process.argv[3] ?? crypto.randomBytes(9).toString("base64url");

// Reuse the existing auth user (e.g. from portal magic-link tests) or create one.
const { data: list, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listError) throw listError;
let user = list.users.find((u) => u.email?.toLowerCase() === email);

if (user) {
  const { error } = await admin.auth.admin.updateUserById(user.id, { password });
  if (error) throw error;
  console.log("Existing auth user found — password set.");
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  user = data.user;
  console.log("Auth user created.");
}

const { error: upsertError } = await admin.from("admins").upsert({
  user_id: user.id,
  first_name: "Timi",
  last_name: "Admin",
  email,
  role: "super_admin",
  menus: [],
  status: "active",
});
if (upsertError) throw upsertError;

console.log("\nSuper admin ready ✔");
console.log("  Sign in at:  http://localhost:3000/admin/login");
console.log(`  Email:       ${email}`);
console.log(`  Password:    ${password}`);
console.log("\n(Change the password any time from /admin/admins.)");
