# Admin Backend (PLAN.md item 12 + foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A real `/admin` area on Supabase — role-gated admins, shipment CRUD with backdatable tracking events, create-shipment wizard that generates tracking numbers, email composer, admin management with menu permissions, app settings, and an AI-interaction audit log.

**Architecture:** Reuses the existing auth stack (Supabase SSR cookie sessions + Next 16 proxy). Admin identity = Supabase auth user (email+password, created by a super admin) **plus** a row in a new `admins` table holding `role` + `menus[]` permissions; `requireAdmin()` in the `/admin` layout is the authoritative gate (proxy redirect is optimistic only). All admin data access goes through the existing service-role client (`getSupabaseAdmin()`) inside server components/actions — RLS stays deny-all for anon. Public tracking (item 13) and the portal map (item 14) are a **separate follow-up plan**; this plan only guarantees their data model exists.

**Tech Stack:** Next 16.2.7 App Router, `@supabase/ssr` 0.12 / `supabase-js` 2.x (incl. `auth.admin.*`), Resend, Vitest 4, Tailwind v4 (Nordic Frost theme).

**Design language:** Blue Route's existing admin-free aesthetic (cards `rounded-3xl border border-steel/70 bg-deep shadow-soft`, gradient accents `from-cyan to-indigo`, `text-foam`/`text-mist`) — the docs/mockups/*.png screenshots define *functionality*, not pixels.

**Deferred (explicitly out of this plan):** logo/favicon upload in App Settings (file-convention icon already exists); public tracking page rebuild; portal RouteMap; CKEditor-style rich text (plain paragraphs composed server-side instead).

---

### Task 1: Schema — admin data model

**Files:**
- Create: `supabase/admin-schema.sql`

- [ ] **Step 1: Write the migration** (full file):

```sql
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
```

- [ ] **Step 2:** Commit. Applying it in the Supabase SQL editor is a **Timi checkpoint** (or do it for him at the next natural pause); code tasks below don't block on it until live verification (Task 12).

```bash
git add supabase/admin-schema.sql
git commit -m "feat: add admin backend schema (admins, shipments, events, bookings, ai audit, settings)"
```

---

### Task 2: Tracking-number generator (pure, TDD)

**Files:**
- Create: `src/lib/admin/tracking-number.ts`
- Test: `src/lib/admin/tracking-number.test.ts`

- [ ] **Step 1: Failing test:**

```ts
import { describe, it, expect } from "vitest";
import { formatTrackingNumber } from "./tracking-number";

describe("formatTrackingNumber", () => {
  it("matches BRL-XXXXXXXX (8 digits)", () => {
    expect(formatTrackingNumber("seed-1")).toMatch(/^BRL-\d{8}$/);
  });
  it("is deterministic for a seed", () => {
    expect(formatTrackingNumber("abc")).toBe(formatTrackingNumber("abc"));
  });
  it("differs across seeds", () => {
    expect(formatTrackingNumber("a")).not.toBe(formatTrackingNumber("b"));
  });
});
```

- [ ] **Step 2:** Run `npx vitest run src/lib/admin/tracking-number.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement** (mirror `src/lib/leads/refs.ts` hash style):

```ts
// Deterministic from a seed (testable); callers pass crypto.randomUUID().
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Public tracking number, e.g. BRL-48203916. */
export function formatTrackingNumber(seed: string): string {
  return `BRL-${String(hashSeed(seed) % 100_000_000).padStart(8, "0")}`;
}
```

- [ ] **Step 4:** Re-run → 3 PASS. **Step 5:** Commit `feat: add tracking number generator`.

---

### Task 3: Admin gate — `getAdmin` / `requireAdmin` + proxy + paths

**Files:**
- Create: `src/lib/admin/auth.ts`
- Modify: `src/lib/auth/paths.ts` + `src/lib/auth/paths.test.ts`
- Modify: `src/proxy.ts`

- [ ] **Step 1: Extend paths helper (TDD).** Add to `paths.test.ts`:

```ts
import { isAdminPath } from "./paths";

describe("isAdminPath", () => {
  it("matches /admin and nested", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/shipments/abc")).toBe(true);
  });
  it("excludes the admin login page itself", () => {
    expect(isAdminPath("/admin/login")).toBe(false);
  });
  it("ignores lookalikes and public routes", () => {
    expect(isAdminPath("/administration")).toBe(false);
    expect(isAdminPath("/portal")).toBe(false);
  });
});
```

Run → FAIL. Implement in `paths.ts`:

```ts
/** /admin pages need an admin session; /admin/login is the way in. */
export function isAdminPath(pathname: string): boolean {
  if (pathname === "/admin/login") return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
```

Run → PASS.

- [ ] **Step 2: Proxy optimistic redirect.** In `src/proxy.ts` import `isAdminPath` and add **before** the portal check:

```ts
  if (!user && isAdminPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
```

- [ ] **Step 3: Authoritative gate** — `src/lib/admin/auth.ts`:

```ts
import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type AdminMenu =
  | "dashboard" | "shipments" | "create" | "email" | "admins" | "settings" | "ai-audit";
export const ALL_MENUS: AdminMenu[] =
  ["dashboard", "shipments", "create", "email", "admins", "settings", "ai-audit"];

export type AdminProfile = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: "super_admin" | "manager";
  menus: AdminMenu[];
  status: "active" | "disabled";
};

/** The signed-in user's admin profile, or null (not signed in / not an admin / disabled). */
export async function getAdmin(): Promise<AdminProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await getSupabaseAdmin()
    .from("admins").select("*").eq("user_id", user.id).maybeSingle();
  if (!data || data.status !== "active") return null;
  const menus = data.role === "super_admin" ? ALL_MENUS : (data.menus ?? []);
  return { ...data, menus } as AdminProfile;
}

/** Layout/action gate. Optionally require a specific menu permission. */
export async function requireAdmin(menu?: AdminMenu): Promise<AdminProfile> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (menu && !admin.menus.includes(menu)) redirect("/admin");
  return admin;
}
```

- [ ] **Step 4:** `npx vitest run && npx tsc --noEmit` → green. Commit `feat: add admin role gate and proxy redirect`.

---

### Task 4: `/admin/login` + `/admin` layout shell with permission-gated sidebar

**Files:**
- Create: `src/app/admin/login/page.tsx` (server: if `getAdmin()` → redirect `/admin`; renders form, reads `?error=`)
- Create: `src/components/admin/admin-login-form.tsx` (client: email+password → `createSupabaseBrowserClient().auth.signInWithPassword`; on success `window.location.assign("/admin")` so the server picks up cookies; inline error on failure. Same glass-card styling as `login-form.tsx`.)
- Create: `src/app/admin/layout.tsx` (server: `const admin = await requireAdmin()`; two-column shell)
- Create: `src/components/admin/admin-sidebar.tsx` (client: `usePathname` active state)

Sidebar items (filtered by `admin.menus` before passing in as a plain serializable array):

```ts
const NAV: { key: AdminMenu; label: string; href: string }[] = [
  { key: "dashboard", label: "Dashboard",          href: "/admin" },
  { key: "shipments", label: "Manage Shipments",   href: "/admin/shipments" },
  { key: "create",    label: "Create Shipment",    href: "/admin/shipments/new" },
  { key: "email",     label: "Email Services",     href: "/admin/email" },
  { key: "admins",    label: "Administrators",     href: "/admin/admins" },
  { key: "settings",  label: "App Settings",       href: "/admin/settings" },
  { key: "ai-audit",  label: "AI Audit",           href: "/admin/ai-audit" },
];
```

Layout structure: dark slate sidebar (`bg-foam text-white`, like the mockups' navy rail but in our ink color) with the wordmark, admin's name + role chip, nav links (active = `bg-gradient-to-r from-cyan to-indigo`), sign-out form POSTing to `/auth/signout`; content area `bg-abyss min-h-screen p-6 lg:p-10`. NOTE: the admin layout must NOT render the public `SiteHeader`/`SiteFooter` — check `src/app/layout.tsx`; the root layout wraps everything, so the admin layout just renders its own shell inside (header/footer hiding: the root layout includes SiteHeader/AIAssistant/SiteFooter — hide via the admin layout rendering a full-screen `fixed inset-0 z-50 overflow-y-auto` surface, OR move header/footer into a route group). **Decision: introduce route groups** — `src/app/(site)/…` keeps the public chrome, `src/app/admin/…` is chrome-free. Moving all existing public routes into `(site)` is mechanical (git mv, no URL changes) and is the clean Next idiom.

Steps: git mv public pages into `src/app/(site)/`, move SiteHeader/footer/assistant imports from root layout into a new `src/app/(site)/layout.tsx`, root layout keeps only html/body/fonts/globals; build; commit `refactor: split public chrome into (site) route group`; then add the admin login + layout + sidebar; build; commit `feat: add admin login and permission-gated admin shell`.

---

### Task 5: Shipment server actions

**Files:**
- Create: `src/app/actions/shipments.ts`
- Create: `src/lib/admin/shipment-validate.ts` (+ `.test.ts`)

Validation (TDD, hand-rolled like `src/lib/leads/validate.ts`): `validateShipmentInput(raw)` requires `receiver_name`, `sender_name`, `origin`, `destination`, valid `freight_type`/`status` from the allowed lists, numeric fields ≥ 0, `delivery_pct` 0–100; returns `{ ok: true, data } | { ok: false, errors: Record<string,string> }`. Test the required-field, enum, and range failures + a passing case (6 tests).

Actions (all start with `await requireAdmin("shipments")` — or `"create"` for createShipment; all `"use server"`):

```ts
export async function createShipment(form: FormData): Promise<{ ok: boolean; trackingNumber?: string; id?: string; errors?: Record<string,string> }>
// validate → tracking_number = formatTrackingNumber(crypto.randomUUID()) → insert
// → optional photo: file from form.get("photo"), upload to storage bucket
//   "shipment-photos" as `${id}.<ext>` via getSupabaseAdmin().storage, store public URL
// → also insert an initial shipment_event (status, origin as location, occurred_at = date_shipped ?? now)

export async function updateShipment(id: string, form: FormData) // validate + update

export async function addShipmentEvent(shipmentId: string, e: { status: string; location: string; country?: string; comment?: string; occurredAt: string }) 
// inserts with occurred_at = new Date(occurredAt) — THIS is backdating;
// also updates the parent shipment's status/current_location to the latest event by occurred_at

export async function deleteShipmentEvent(id: string, shipmentId: string)
export async function updateShipmentEvent(id: string, shipmentId: string, e: { …same fields })  // backdate an existing entry
```

`revalidatePath("/admin/shipments")` after each mutation. Gates: vitest (validation tests) + tsc. Commit `feat: add shipment server actions with backdatable events`.

---

### Task 6: Admin dashboard (`/admin`)

**Files:** Create `src/app/admin/page.tsx` (server).

Server component: service-role queries — `count` head queries for total / In Transit / Delivered / On Hold, last-6-months counts grouped client-side from `created_at >= 6 months ago` select, latest 5 shipments. Render: 4 KPI cards (same card classes as portal), an SVG bar chart (copy the portal spend-chart technique in `portal-dashboard.tsx`), "Latest shipments" table (tracking #, receiver, route, status badge, date) linking to `/admin/shipments/[id]`, and quick-action buttons (New shipment / Manage / Email). Build + commit `feat: add admin dashboard`.

---

### Task 7: Manage shipments — list + editor

**Files:**
- Create: `src/app/admin/shipments/page.tsx` (server; `searchParams.q` filters `tracking_number.ilike` OR `receiver_name.ilike` via `.or()`; table mirrors mockup 6: receiver, tracking #, current location, destination, status badge, shipped date, Manage button)
- Create: `src/app/admin/shipments/[id]/page.tsx` (server; fetch shipment + events ordered by `occurred_at desc`; render `<ShipmentEditor …/>`)
- Create: `src/components/admin/shipment-editor.tsx` (client)

Editor (mockup 14 functionality): one form with ALL shipment fields (sections Recipient / Sender / Shipping / Status & location / Costs) submitting to `updateShipment`; below it the **tracking log**: each event row shows status, location, country, `datetime-local` input prefilled with `occurred_at`, comment — Save (updateShipmentEvent) and Delete buttons; an "Add event" row with the same fields (addShipmentEvent) — setting a past datetime backdates, setting location updates the shipment's current location. `useTransition` + inline success/error text. Status select options = the schema's allowed list. Build + commit `feat: add shipment management list and editor with backdatable log`.

---

### Task 8: Create-shipment wizard

**Files:**
- Create: `src/app/admin/shipments/new/page.tsx` (server: `requireAdmin("create")`, renders wizard)
- Create: `src/components/admin/shipment-wizard.tsx` (client)

4 steps mirroring mockups 7–9 in our quote-wizard style (`src/components/quote/quote-wizard.tsx` is the pattern): 1 Recipient → 2 Sender → 3 Shipping (origin, destination, freight type, content type, weight, qty, description, dates, costs, current location/city, delivery %, optional photo `<input type="file" accept="image/*">`) → 4 Review → submit `createShipment(FormData)` → success panel shows the generated **tracking number** big + copy button + links (Manage / public tracking `/tracking?ref=…`). Client-side step validation for required fields before advancing. Build + commit `feat: add create-shipment wizard with generated tracking number`.

---

### Task 9: Email services

**Files:**
- Create: `src/app/actions/admin-email.ts` (`sendAdminEmail`: `requireAdmin("email")`; recipients: category `"all"` → distinct non-null `receiver_email` from shipments (+ `quote_requests.email`), or `"single"` → one address; compose HTML with the existing template look — import `wrapEmailHtml`-style helpers from `src/lib/email/templates.ts` if exported, else simple branded wrapper; send via `sendEmails` (chunks of 50))
- Create: `src/app/admin/email/page.tsx` + `src/components/admin/email-composer.tsx` (client: category select [All customers / Single address], greeting, subject, message textarea (plain paragraphs → `<p>` blocks), Send with pending state + sent count result. Banner notes Resend test mode until domain verified.)

Build + commit `feat: add admin email composer`.

---

### Task 10: Administrators

**Files:**
- Create: `src/app/actions/admins.ts`
- Create: `src/app/admin/admins/page.tsx` (server: `requireAdmin("admins")`; list table per mockup 12 + `<AddManagerForm/>` + per-row `<AdminRowEditor/>`)
- Create: `src/components/admin/manage-admins.tsx` (client: both forms)

Actions (each begins `const actor = await requireAdmin("admins"); if (actor.role !== "super_admin") return { ok:false, error:"Super admin only" };`):

```ts
createManager({ firstName, lastName, email, phone, role, menus, password })
// getSupabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true })
// → insert admins row (user_id = created user id). Duplicate email → friendly error.
updateManager(userId, { role?, menus?, status?, password? })
// password → auth.admin.updateUserById(userId, { password }); rest → update admins row.
// Guard: cannot disable/demote yourself (actor.user_id === userId → error).
deleteManager(userId) // auth.admin.deleteUser → cascades the admins row. Same self-guard.
```

UI: add-manager form (mockup 11 fields + menu-permission checkboxes shown when role=manager); managers table with role/status chips and an expandable editor row (change role, menus, status, set new password). Build + commit `feat: add administrator management with menu permissions`.

---

### Task 11: App settings + AI audit

**Files:**
- Create: `src/app/actions/settings.ts` (`saveSettings(entries: Record<string,string>)` → `requireAdmin("settings")` → upsert rows)
- Create: `src/app/admin/settings/page.tsx` + `src/components/admin/settings-form.tsx` (client)
- Modify: `src/app/actions/advisor.ts` — after the Groq call (success or failure), best-effort insert into `ai_interactions` (`question`, `answer`, `cta_path`, `model`, `duration_ms`, `ok`) wrapped in try/catch so logging can never break the assistant
- Create: `src/app/admin/ai-audit/page.tsx` (server: `requireAdmin("ai-audit")`; KPI cards total / last 7 days / error count; table of latest 50 interactions w/ expandable answer text)

Settings keys (text inputs, seeded with current site values as placeholders): `site_name`, `site_tagline`, `contact_phone`, `sales_email`, `support_email`, `hq_address`. (Wiring these into the public site is a later polish item; the admin manages the values now.) Build + commit `feat: add app settings and AI interaction audit`.

---

### Task 12: Gates + live verification + PLAN.md

- [ ] `npm test` (expect 42 + ~12 new = ~54), `npx tsc --noEmit`, `npm run lint`, `npm run build` — all green; routes include `/admin`, `/admin/login`, `/admin/shipments`, `/admin/shipments/new`, `/admin/shipments/[id]`, `/admin/email`, `/admin/admins`, `/admin/settings`, `/admin/ai-audit`.
- [ ] **Checkpoint (needs schema applied):** apply `supabase/admin-schema.sql` in the SQL editor; then seed the first super admin with a throwaway script (auth.admin.createUser + admins insert, role `super_admin`) using Timi's chosen email+password; verify: login → dashboard → create shipment via wizard → tracking number generated → edit it, backdate an event → appears reordered; create a limited manager (only `shipments`) → their sidebar hides other menus and direct URLs bounce to `/admin`.
- [ ] Update `docs/PLAN.md` item 12 → ✅ (note deferred bits) and build order; commit `docs: mark admin backend done`.
