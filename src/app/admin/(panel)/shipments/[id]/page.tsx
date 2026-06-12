import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ShipmentActions } from "@/components/admin/shipment-actions";
import { TrackingLog } from "@/components/admin/tracking-log";
import type {
  ShipmentRecord,
  ShipmentEventRecord,
} from "@/components/admin/shipment-editor";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Shipment Details" };
export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, string> = {
  Pending: "bg-steel/60 text-mist",
  Approved: "bg-indigo/10 text-indigo",
  "In Transit": "bg-cyan/10 text-cyan",
  "On Hold": "bg-rose/10 text-rose",
  Customs: "bg-amber/10 text-amber",
  "Out for Delivery": "bg-aqua/10 text-aqua",
  Delivered: "bg-emerald/10 text-emerald",
};

function Chip({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-mist">{label}</p>
      <span
        className={cn(
          "mt-1.5 inline-block rounded-full px-3 py-1.5 text-sm font-semibold",
          className ?? "bg-abyss text-foam",
        )}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("shipments");
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const [{ data }, { data: events }] = await Promise.all([
    supabase.from("shipments").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("shipment_events")
      .select("*")
      .eq("shipment_id", id)
      .order("occurred_at", { ascending: false }),
  ]);
  if (!data) notFound();
  const s = data as ShipmentRecord;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/shipments"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mist hover:text-foam"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1
            className="mt-2 text-2xl font-semibold text-foam"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tracking number: <span className="text-cyan">{s.tracking_number}</span>
          </h1>
          <p className="mt-1 text-sm text-mist">
            Details of shipment from <span className="font-medium text-foam">{s.sender_name}</span> to{" "}
            <span className="font-medium text-foam">{s.receiver_name}</span>
            {" · "}
            <a
              href={`/tracking?ref=${s.tracking_number}`}
              target="_blank"
              className="font-medium text-cyan hover:underline"
            >
              public tracking ↗
            </a>
          </p>
        </div>
        <ShipmentActions
          shipmentId={s.id}
          receiverName={s.receiver_name}
          receiverEmail={s.receiver_email}
        />
      </div>

      {/* Summary chips */}
      <div className="mt-6 grid gap-x-6 gap-y-5 rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <Chip label="Receiver's name" value={s.receiver_name} className="bg-cyan/10 text-cyan" />
        <Chip label="Receiver's email" value={s.receiver_email} className="bg-amber/10 text-amber" />
        <Chip label="Receiver's address" value={s.receiver_address} className="bg-amber/10 text-amber" />
        <Chip label="Receiver's country" value={s.receiver_country} className="bg-rose/10 text-rose" />
        <Chip label="Shipment type" value={s.content_type ?? s.freight_type} className="bg-indigo/10 text-indigo" />
        <Chip label="Current location" value={s.current_location} className="bg-teal/10 text-teal" />
        <Chip label="Status" value={s.status} className={STATUS_CHIP[s.status]} />
        <Chip
          label="Expected delivery"
          value={
            s.expected_delivery
              ? new Date(`${s.expected_delivery}T12:00:00Z`).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null
          }
          className="bg-emerald/10 text-emerald"
        />
      </div>

      {/* Progress */}
      <div className="mt-5 rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foam">Delivery progress</span>
          <span className="font-semibold text-cyan">{s.delivery_pct}%</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-steel/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan to-indigo"
            style={{ width: `${s.delivery_pct}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-mist">
          {s.origin} → {s.destination}
        </p>
      </div>

      <TrackingLog shipmentId={s.id} events={(events ?? []) as ShipmentEventRecord[]} />
    </div>
  );
}
