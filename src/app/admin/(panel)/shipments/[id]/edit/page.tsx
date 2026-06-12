import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ShipmentEditor, type ShipmentRecord } from "@/components/admin/shipment-editor";

export const metadata: Metadata = { title: "Edit Shipment" };
export const dynamic = "force-dynamic";

export default async function EditShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("shipments");
  const { id } = await params;
  const { data } = await getSupabaseAdmin()
    .from("shipments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const s = data as ShipmentRecord;

  return (
    <div>
      <Link
        href={`/admin/shipments/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-mist hover:text-foam"
      >
        <ArrowLeft className="h-4 w-4" /> Shipment details
      </Link>
      <h1
        className="mt-2 text-2xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Edit {s.tracking_number}
      </h1>
      <div className="mt-6 max-w-3xl">
        <ShipmentEditor shipment={s} />
      </div>
    </div>
  );
}
