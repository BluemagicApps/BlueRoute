import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ShipmentEditor, type ShipmentRecord, type ShipmentEventRecord } from "@/components/admin/shipment-editor";

export const metadata: Metadata = { title: "Edit Shipment" };
export const dynamic = "force-dynamic";

export default async function EditShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("shipments");
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const [{ data: shipment }, { data: events }] = await Promise.all([
    supabase.from("shipments").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("shipment_events")
      .select("*")
      .eq("shipment_id", id)
      .order("occurred_at", { ascending: false }),
  ]);
  if (!shipment) notFound();

  return (
    <div>
      <Link
        href="/admin/shipments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-mist hover:text-foam"
      >
        <ArrowLeft className="h-4 w-4" /> All shipments
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1
          className="text-2xl font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {shipment.tracking_number}
        </h1>
        <a
          href={`/tracking?ref=${shipment.tracking_number}`}
          target="_blank"
          className="rounded-full border border-steel bg-deep px-3 py-1 text-xs font-medium text-mist hover:text-foam"
        >
          View public tracking ↗
        </a>
      </div>
      <ShipmentEditor
        shipment={shipment as ShipmentRecord}
        events={(events ?? []) as ShipmentEventRecord[]}
      />
    </div>
  );
}
