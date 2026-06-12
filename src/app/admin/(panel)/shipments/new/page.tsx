import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { ShipmentWizard } from "@/components/admin/shipment-wizard";

export const metadata: Metadata = { title: "Create Shipment" };

export default async function NewShipmentPage() {
  await requireAdmin("create");
  return (
    <div>
      <h1
        className="text-2xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Create a new shipment
      </h1>
      <p className="mt-1 text-sm text-mist">
        Four quick steps — the tracking number is generated when you finish.
      </p>
      <div className="mt-6 max-w-3xl">
        <ShipmentWizard />
      </div>
    </div>
  );
}
