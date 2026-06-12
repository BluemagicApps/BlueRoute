import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ShipmentRecord } from "@/components/admin/shipment-editor";
import { PrintButton } from "@/components/admin/print-button";

export const metadata: Metadata = { title: "Shipping Invoice" };
export const dynamic = "force-dynamic";

function money(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function ShipmentInvoicePage({
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
  const total = (s.shipment_cost ?? 0) + (s.clearance_cost ?? 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="rounded-3xl border border-steel/70 bg-white p-10 shadow-soft print:border-0 print:shadow-none">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-foam" style={{ fontFamily: "var(--font-display)" }}>
              Blue <span className="text-cyan">Route</span>
            </p>
            <p className="mt-1 text-sm text-mist">
              3229 Hadley St, Houston, TX 77004 · +1 (323) 484-8030
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foam">SHIPPING INVOICE</p>
            <p className="mt-1 text-sm text-mist">{s.tracking_number}</p>
            <p className="text-sm text-mist">
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mist">From (sender)</p>
            <p className="mt-2 font-semibold text-foam">{s.sender_name}</p>
            <p className="text-sm text-mist">{s.sender_address}</p>
            <p className="text-sm text-mist">{s.sender_country}</p>
            <p className="text-sm text-mist">{s.sender_email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mist">To (receiver)</p>
            <p className="mt-2 font-semibold text-foam">{s.receiver_name}</p>
            <p className="text-sm text-mist">{s.receiver_address}</p>
            <p className="text-sm text-mist">{s.receiver_country}</p>
            <p className="text-sm text-mist">{s.receiver_email}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-foam text-xs uppercase tracking-wide text-mist">
              <th className="py-2.5 font-semibold">Description</th>
              <th className="py-2.5 font-semibold">Details</th>
              <th className="py-2.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-steel/60">
              <td className="py-3 font-medium text-foam">
                {s.freight_type} — {s.content_type ?? "General cargo"}
              </td>
              <td className="py-3 text-mist">
                {s.origin} → {s.destination}
                {s.weight_kg ? ` · ${s.weight_kg.toLocaleString()} kg` : ""}
                {s.qty ? ` · qty ${s.qty}` : ""}
              </td>
              <td className="py-3 text-right text-foam">{money(s.shipment_cost)}</td>
            </tr>
            <tr className="border-b border-steel/60">
              <td className="py-3 font-medium text-foam">Customs clearance</td>
              <td className="py-3 text-mist">Documentation & duties handling</td>
              <td className="py-3 text-right text-foam">{money(s.clearance_cost)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="py-4 text-right font-semibold text-foam">
                Total
              </td>
              <td className="py-4 text-right text-lg font-bold text-cyan">{money(total)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-8 border-t border-steel/60 pt-4 text-xs text-mist">
          Thank you for shipping with Blue Route Logistics. Track this shipment
          any time at blueroute.com/tracking with tracking number {s.tracking_number}.
        </p>
      </div>
    </div>
  );
}
