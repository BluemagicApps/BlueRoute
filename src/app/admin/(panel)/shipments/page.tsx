import type { Metadata } from "next";
import Link from "next/link";
import { Search, PackagePlus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Shipments" };
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

type Row = {
  id: string;
  tracking_number: string;
  receiver_name: string;
  current_location: string | null;
  destination: string;
  status: string;
  date_shipped: string | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${days < 60 ? "" : "s"} ago`;
  return `${Math.floor(days / 365)} year${days < 730 ? "" : "s"} ago`;
}

export default async function ManageShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin("shipments");
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  let dbq = getSupabaseAdmin()
    .from("shipments")
    .select(
      "id, tracking_number, receiver_name, current_location, destination, status, date_shipped, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (query) {
    const like = `%${query.replaceAll("%", "")}%`;
    dbq = dbq.or(
      `tracking_number.ilike.${like},receiver_name.ilike.${like},receiver_email.ilike.${like}`,
    );
  }
  const { data } = await dbq;
  const rows = (data ?? []) as Row[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1
          className="text-2xl font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Manage shipments
        </h1>
        <Link
          href="/admin/shipments/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
        >
          <PackagePlus className="h-4 w-4" /> New shipment
        </Link>
      </div>

      <form method="GET" className="mt-5 flex max-w-md items-center gap-2 rounded-2xl border border-steel bg-deep px-4 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-mist" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search tracking #, receiver name, or email…"
          className="w-full bg-transparent text-sm text-foam outline-none placeholder:text-mist/70"
        />
      </form>

      <div className="mt-5 overflow-x-auto rounded-3xl border border-steel/70 bg-deep shadow-soft">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-steel/60 text-xs uppercase tracking-wide text-mist">
              <th className="px-5 py-3.5 font-medium">Receiver</th>
              <th className="px-5 py-3.5 font-medium">Tracking #</th>
              <th className="px-5 py-3.5 font-medium">Current location</th>
              <th className="px-5 py-3.5 font-medium">Destination</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium">Shipped</th>
              <th className="px-5 py-3.5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-mist">
                  {query ? `No shipments match “${query}”.` : "No shipments yet."}
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-steel/40 last:border-0">
                <td className="px-5 py-3.5 font-medium text-foam">{s.receiver_name}</td>
                <td className="px-5 py-3.5 text-mist">{s.tracking_number}</td>
                <td className="px-5 py-3.5 text-mist">{s.current_location ?? "—"}</td>
                <td className="px-5 py-3.5 text-mist">{s.destination}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_BADGE[s.status] ?? "bg-steel/60 text-mist")}>
                    {s.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-mist">
                  {timeAgo(s.date_shipped ? `${s.date_shipped}T12:00:00Z` : s.created_at)}
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/admin/shipments/${s.id}`}
                    className="rounded-full bg-gradient-to-br from-cyan to-indigo px-3.5 py-1.5 text-xs font-semibold text-white"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
