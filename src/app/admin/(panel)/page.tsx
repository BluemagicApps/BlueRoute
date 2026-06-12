import Link from "next/link";
import { Ship, PackagePlus, Mail, ArrowRight } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-steel/60 text-mist",
  Approved: "bg-indigo/10 text-indigo",
  "In Transit": "bg-cyan/10 text-cyan",
  "On Hold": "bg-rose/10 text-rose",
  Customs: "bg-amber/10 text-amber",
  "Out for Delivery": "bg-aqua/10 text-aqua",
  Delivered: "bg-emerald/10 text-emerald",
};

type LatestRow = {
  id: string;
  tracking_number: string;
  receiver_name: string;
  origin: string;
  destination: string;
  status: string;
  created_at: string;
};

async function countWhere(status?: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from("shipments").select("id", { count: "exact", head: true });
  if (status) q = q.eq("status", status);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin("dashboard");
  const supabase = getSupabaseAdmin();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [total, inTransit, delivered, onHold, latestRes, monthsRes] =
    await Promise.all([
      countWhere(),
      countWhere("In Transit"),
      countWhere("Delivered"),
      countWhere("On Hold"),
      supabase
        .from("shipments")
        .select("id, tracking_number, receiver_name, origin, destination, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("shipments")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString()),
    ]);

  const latest = (latestRes.data ?? []) as LatestRow[];

  // Shipments per month for the last 6 months.
  const months: { label: string; key: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleString("en-US", { month: "short" }),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      count: 0,
    });
  }
  for (const row of monthsRes.data ?? []) {
    const d = new Date(row.created_at as string);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.count++;
  }
  const maxCount = Math.max(1, ...months.map((m) => m.count));

  const kpis = [
    { label: "Total shipments", value: total, color: "text-foam" },
    { label: "In transit", value: inTransit, color: "text-cyan" },
    { label: "Delivered", value: delivered, color: "text-emerald" },
    { label: "On hold", value: onHold, color: "text-rose" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold text-foam"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome back, {admin.first_name}
          </h1>
          <p className="mt-1 text-sm text-mist">
            Here&apos;s what&apos;s moving across Blue Route today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {admin.menus.includes("create") && (
            <Link
              href="/admin/shipments/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
            >
              <PackagePlus className="h-4 w-4" /> New shipment
            </Link>
          )}
          {admin.menus.includes("shipments") && (
            <Link
              href="/admin/shipments"
              className="inline-flex items-center gap-1.5 rounded-full border border-steel bg-deep px-4 py-2.5 text-sm font-medium text-foam"
            >
              <Ship className="h-4 w-4" /> Manage
            </Link>
          )}
          {admin.menus.includes("email") && (
            <Link
              href="/admin/email"
              className="inline-flex items-center gap-1.5 rounded-full border border-steel bg-deep px-4 py-2.5 text-sm font-medium text-foam"
            >
              <Mail className="h-4 w-4" /> Email
            </Link>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-3xl border border-steel/70 bg-deep p-5 shadow-soft">
            <p className="text-sm text-mist">{k.label}</p>
            <p
              className={cn("mt-1 text-3xl font-semibold", k.color)}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Monthly chart */}
        <div className="rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft lg:col-span-2">
          <h2 className="text-sm font-semibold text-foam">Shipments — last 6 months</h2>
          <div className="mt-6 flex h-40 items-end gap-3">
            {months.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-cyan to-indigo"
                  style={{ height: `${Math.max(4, (m.count / maxCount) * 100)}%` }}
                  title={`${m.count}`}
                />
                <span className="text-xs text-mist">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Latest shipments */}
        <div className="rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foam">Latest shipments</h2>
            <Link href="/admin/shipments" className="inline-flex items-center gap-1 text-sm font-medium text-cyan hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {latest.length === 0 ? (
            <p className="mt-6 text-sm text-mist">
              No shipments yet — create the first one with the wizard.
            </p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-mist">
                  <th className="py-2 pr-3 font-medium">Tracking #</th>
                  <th className="py-2 pr-3 font-medium">Receiver</th>
                  <th className="hidden py-2 pr-3 font-medium md:table-cell">Route</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((s) => (
                  <tr key={s.id} className="border-t border-steel/50">
                    <td className="py-3 pr-3">
                      <Link href={`/admin/shipments/${s.id}`} className="font-semibold text-cyan hover:underline">
                        {s.tracking_number}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-foam">{s.receiver_name}</td>
                    <td className="hidden py-3 pr-3 text-mist md:table-cell">
                      {s.origin} → {s.destination}
                    </td>
                    <td className="py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_BADGE[s.status] ?? "bg-steel/60 text-mist")}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
