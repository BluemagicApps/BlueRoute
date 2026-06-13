import type { Metadata } from "next";
import { QuoteWizard } from "@/components/quote/quote-wizard";
import { ServiceQuoteWizard } from "@/components/quote/service-quote-wizard";
import { getServiceQuoteConfig } from "@/lib/quote/service-fields";
import type { CargoMode } from "@/lib/quote-data";

export const metadata: Metadata = {
  title: "Get a Quote",
  description:
    "Get an AI-optimized shipping quote in seconds — compare express, balanced, and low-carbon routes with carbon estimates and instant booking.",
};

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const config = service ? getServiceQuoteConfig(service) : undefined;

  if (config) {
    const heading = config.title.replace(/ quote$/i, "");
    return (
      <section className="relative pt-28 pb-20 lg:pt-32">
        <div className="bg-grid absolute inset-0 -z-10 h-96" />
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <h1
            className="text-balance text-3xl font-semibold tracking-tight text-foam md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Request a <span className="text-gradient">{heading}</span> quote
          </h1>
          <p className="mt-2 text-mist">
            Tell us about your shipment — no payment now. Our team replies with options and pricing.
          </p>
          <ServiceQuoteWizard config={config} />
        </div>
      </section>
    );
  }

  const initialMode: CargoMode = service === "ocean-freight" ? "port-to-port" : "door-to-door";
  return <QuoteWizard initialMode={initialMode} />;
}
