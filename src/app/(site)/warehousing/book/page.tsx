import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FACILITIES } from "@/lib/warehouse-data";
import { WarehouseBookingWizard } from "@/components/warehouse/warehouse-booking-wizard";

export const metadata: Metadata = {
  title: "Request a Warehouse",
  description: "Request a Blue Route warehouse facility — no payment, staff-confirmed availability.",
};

export default async function WarehouseBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ facility?: string }>;
}) {
  const { facility: facilityId } = await searchParams;
  const facility = FACILITIES.find((f) => f.id === facilityId);
  if (!facility) notFound();

  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-96" />
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Link href="/warehousing" className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to facilities
        </Link>
        <div className="mt-4">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foam md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Request <span className="text-gradient">{facility.name}</span>
          </h1>
          <p className="mt-2 text-mist">
            {facility.city}, {facility.country} · {facility.sqft.toLocaleString()} ft² ·
            ${facility.pricePerSqftYear}/ft²/yr
          </p>
        </div>
        <WarehouseBookingWizard
          facility={{
            id: facility.id,
            name: facility.name,
            city: facility.city,
            country: facility.country,
            features: facility.features,
          }}
        />
      </div>
    </section>
  );
}
