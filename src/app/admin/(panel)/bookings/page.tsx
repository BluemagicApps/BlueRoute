import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { FACILITIES } from "@/lib/warehouse-data";
import { BookingActions } from "@/components/admin/booking-actions";

export const metadata: Metadata = { title: "Bookings" };

const STATUSES = ["all", "new", "approved", "rejected", "closed"] as const;

type BookingRow = {
  id: string;
  created_at: string;
  type: string;
  warehouse_id: string | null;
  service_slug: string | null;
  name: string;
  email: string;
  company: string | null;
  details: Record<string, unknown> | null;
  status: string;
  booking_ref: string;
};

function facilityName(id: string | null): string {
  if (!id) return "—";
  return FACILITIES.find((f) => f.id === id)?.name ?? id;
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin("bookings");
  const { status } = await searchParams;
  const active = STATUSES.includes((status ?? "all") as (typeof STATUSES)[number])
    ? (status ?? "all")
    : "all";

  let query = getSupabaseAdmin()
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (active !== "all") query = query.eq("status", active);
  const { data } = await query;
  const rows = (data ?? []) as BookingRow[];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
        Bookings
      </h1>
      <p className="mt-1 text-sm text-mist">Warehouse and service requests from customers.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/bookings" : `/admin/bookings?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${active === s ? "bg-gradient-to-br from-cyan to-indigo text-white" : "border border-steel/70 text-mist hover:text-foam"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-steel/70 bg-deep shadow-soft">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-steel/60 text-xs uppercase tracking-wide text-mist">
            <tr>
              <th className="px-4 py-3 font-semibold">Ref</th>
              <th className="px-4 py-3 font-semibold">Facility / Service</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Request</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel/50 text-foam">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">No bookings yet.</td></tr>
            )}
            {rows.map((b) => {
              const d = b.details ?? {};
              return (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono text-xs">{b.booking_ref}</td>
                  <td className="px-4 py-3">
                    {b.type === "warehouse" ? facilityName(b.warehouse_id) : b.service_slug ?? "—"}
                  </td>
                  <td className="px-4 py-3">{b.company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="block">{b.name}</span>
                    <span className="block text-xs text-mist">{b.email}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-mist">
                    {d.sqftRequested ? `${Number(d.sqftRequested).toLocaleString()} ft²` : "—"}
                    {d.moveIn ? ` · ${String(d.moveIn)}` : ""}
                    {d.termMonths ? ` · ${String(d.termMonths)}mo` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <BookingActions id={b.id} status={b.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
