import type { Metadata } from "next";
import { TransportVariants } from "@/components/lab/transport-variants";

export const metadata: Metadata = {
  title: "Transport Imagery Lab",
  robots: { index: false, follow: false },
};

export default function TransportLabPage() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-40">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            Internal · Pick one
          </span>
          <h1
            className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Transport imagery — <span className="text-gradient">5 variants</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-mist">
            Five ways to bring realistic ship / plane / train / truck photography
            into the Nordic Frost theme. Tell me the number you want and I&apos;ll
            wire it across the home hero and service pages, then remove the rest.
          </p>
        </div>

        <div className="mt-14">
          <TransportVariants />
        </div>
      </div>
    </section>
  );
}
