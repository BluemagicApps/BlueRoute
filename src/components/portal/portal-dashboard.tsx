"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ship,
  Sparkles,
  Plus,
  MapPin,
  Warehouse,
  Download,
  ArrowRight,
  TrendingUp,
  LogOut,
} from "lucide-react";
import {
  PORTAL_USER,
  KPIS,
  SHIPMENTS,
  INVOICES,
  SPEND,
  INVENTORY,
  AI_INSIGHTS,
  type Shipment,
} from "@/lib/portal-data";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

const KPI_COLOR: Record<string, string> = {
  cyan: "text-cyan",
  emerald: "text-emerald",
  indigo: "text-indigo",
  teal: "text-teal",
};

const STATUS: Record<Shipment["status"], string> = {
  "In transit": "bg-cyan/10 text-cyan",
  "At port": "bg-indigo/10 text-indigo",
  Customs: "bg-amber/10 text-amber",
  Delivered: "bg-emerald/10 text-emerald",
  Booked: "bg-steel/60 text-mist",
};

const TABS = ["Overview", "Shipments", "Invoices", "Inventory"] as const;
type Tab = (typeof TABS)[number];

export function PortalDashboard({
  userEmail,
}: {
  userEmail?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const displayName = userEmail ?? PORTAL_USER.name;
  const initials = (
    userEmail ? userEmail.replace(/@.*$/, "").slice(0, 2) : PORTAL_USER.initials
  ).toUpperCase();
  const subline = userEmail ? "Blue Route customer" : PORTAL_USER.company;

  return (
    <section className="relative pt-24 pb-20 lg:pt-28">
      <div className="bg-grid absolute inset-0 -z-10 h-72" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Greeting band */}
        <div className="bg-aurora-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-soft md:p-8">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <span
                className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {initials}
              </span>
              <div>
                <p className="text-sm text-white/80">Welcome back</p>
                <h1
                  className="text-2xl font-semibold md:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {displayName}
                </h1>
                <p className="text-sm text-white/85">{subline}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/quote" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-cyan">
                <Plus className="h-4 w-4" /> New quote
              </Link>
              <Link href="/tracking" className="inline-flex items-center gap-1.5 rounded-full border border-white/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10">
                <MapPin className="h-4 w-4" /> Track
              </Link>
              <Link href="/warehousing" className="inline-flex items-center gap-1.5 rounded-full border border-white/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10">
                <Warehouse className="h-4 w-4" /> Lease
              </Link>
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-3xl border border-steel/70 bg-deep p-5 shadow-soft">
              <p className="text-sm text-mist">{k.label}</p>
              <p
                className={cn("mt-1 text-3xl font-semibold", KPI_COLOR[k.color])}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {k.value}
              </p>
              <p className="mt-1 text-xs text-mist">{k.delta}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-steel/70 bg-deep p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                tab === t ? "bg-gradient-to-br from-cyan to-indigo text-white" : "text-mist hover:text-foam"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            >
              {tab === "Overview" && <Overview onSeeAll={() => setTab("Shipments")} />}
              {tab === "Shipments" && <Shipments />}
              {tab === "Invoices" && <Invoices />}
              {tab === "Inventory" && <Inventory />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ---------- Overview ---------- */
function Overview({ onSeeAll }: { onSeeAll: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHead title="Active shipments">
          <button onClick={onSeeAll} className="text-sm font-medium text-cyan">
            View all →
          </button>
        </CardHead>
        <div className="space-y-3">
          {SHIPMENTS.slice(0, 4).map((s) => (
            <ShipmentRow key={s.ref} s={s} />
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHead title="Spend trend" />
          <SpendChart />
        </Card>
        <Card>
          <CardHead title="AI insights" badge />
          <ul className="space-y-2.5">
            {AI_INSIGHTS.map((t, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-abyss p-3 text-xs leading-relaxed text-mist">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Shipments ---------- */
function Shipments() {
  return (
    <Card>
      <CardHead title="All shipments">
        <Link href="/tracking" className="text-sm font-medium text-cyan">
          Open tracking →
        </Link>
      </CardHead>
      <div className="space-y-3">
        {SHIPMENTS.map((s) => (
          <ShipmentRow key={s.ref} s={s} detailed />
        ))}
      </div>
    </Card>
  );
}

function ShipmentRow({ s, detailed }: { s: Shipment; detailed?: boolean }) {
  return (
    <Link
      href={`/tracking?ref=${s.ref}`}
      className="group block rounded-2xl border border-steel/60 bg-abyss p-4 transition-colors hover:border-cyan/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan/10 text-cyan">
            <Ship className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foam">{s.lane}</p>
            <p className="text-xs text-mist">{s.ref} · {s.mode}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS[s.status])}>
            {s.status}
          </span>
          <ArrowRight className="h-4 w-4 text-mist transition-transform group-hover:translate-x-1" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-steel/60">
          <div className="h-full rounded-full bg-gradient-to-r from-aqua to-cyan" style={{ width: `${s.progress}%` }} />
        </div>
        <span className="shrink-0 text-xs text-mist">
          ETA {s.eta}{detailed ? ` · ${s.confidence}% conf.` : ""}
        </span>
      </div>
    </Link>
  );
}

/* ---------- Invoices ---------- */
function Invoices() {
  const INV_STATUS: Record<string, string> = {
    Paid: "bg-emerald/10 text-emerald",
    Due: "bg-amber/10 text-amber",
    Overdue: "bg-rose/10 text-rose",
  };
  return (
    <Card>
      <CardHead title="Invoices" />
      <div className="overflow-hidden rounded-2xl border border-steel/60">
        <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-4 bg-abyss px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-mist sm:grid">
          <span>Invoice</span>
          <span>Date</span>
          <span>Amount</span>
          <span>Status</span>
        </div>
        {INVOICES.map((inv) => (
          <div
            key={inv.id}
            className="grid grid-cols-2 items-center gap-4 border-t border-steel/50 px-4 py-3 text-sm sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <span className="font-medium text-foam">{inv.id}</span>
            <span className="text-mist">{inv.date}</span>
            <span className="font-medium text-foam">{inv.amount}</span>
            <div className="flex items-center justify-end gap-3">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", INV_STATUS[inv.status])}>
                {inv.status}
              </span>
              <button aria-label="Download" className="text-mist hover:text-cyan">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Inventory ---------- */
function Inventory() {
  return (
    <Card>
      <CardHead title="Warehouse inventory">
        <Link href="/warehousing" className="text-sm font-medium text-cyan">
          Lease more →
        </Link>
      </CardHead>
      <div className="space-y-4">
        {INVENTORY.map((w) => (
          <div key={w.hub} className="rounded-2xl border border-steel/60 bg-abyss p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foam">{w.hub}</p>
              <span className="text-sm text-mist">
                {w.used} / {w.total} ft²
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-steel/60">
                <div
                  className={cn(
                    "h-full rounded-full",
                    w.usedPct > 75 ? "bg-gradient-to-r from-amber to-rose" : "bg-gradient-to-r from-cyan to-indigo"
                  )}
                  style={{ width: `${w.usedPct}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-medium text-foam">{w.usedPct}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Spend chart ---------- */
function SpendChart() {
  const max = Math.max(...SPEND.map((s) => s.v));
  return (
    <div>
      <div className="flex h-32 items-end gap-2">
        {SPEND.map((s, i) => (
          <div key={s.m} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-cyan to-indigo"
              style={{ height: `${(s.v / max) * 100}%`, opacity: 0.55 + (i / SPEND.length) * 0.45 }}
            />
            <span className="text-[0.65rem] text-mist">{s.m}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 inline-flex items-center gap-1 text-xs text-emerald">
        <TrendingUp className="h-3.5 w-3.5" /> Tracking 6% under forecast
      </p>
    </div>
  );
}

/* ---------- Shared ---------- */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft">{children}</div>
  );
}

function CardHead({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
        {title}
        {badge && (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-cyan">
            <Sparkles className="h-3 w-3" /> AI
          </span>
        )}
      </h2>
      {children}
    </div>
  );
}
