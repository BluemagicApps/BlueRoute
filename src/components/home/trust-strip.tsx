import { Reveal } from "@/components/ui/reveal";

const STATS = [
  { value: "180+", label: "Countries served" },
  { value: "2.4M", label: "Containers moved / yr" },
  { value: "94%", label: "On-time, AI-verified" },
  { value: "60s", label: "To an optimized quote" },
];

const PARTNERS = [
  "OCEANIC",
  "PORTLINK",
  "VANTA FREIGHT",
  "NORDSTAR",
  "MERIDIAN",
  "CARGOWORKS",
  "HELIOS TRADE",
];

export function TrustStrip() {
  return (
    <section className="relative border-y border-steel/60 bg-gradient-to-b from-white/70 to-navy/40 py-14">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <p
                className="text-gradient text-4xl font-semibold tracking-tight lg:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s.value}
              </p>
              <p className="mt-1 text-sm text-mist">{s.label}</p>
            </Reveal>
          ))}
        </div>

        {/* Marquee */}
        <div className="relative mt-12 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <p className="mb-5 text-center text-xs uppercase tracking-[0.25em] text-mist/70">
            Trusted by global shippers &amp; freight teams
          </p>
          <div className="flex w-max animate-[br-marquee_28s_linear_infinite] items-center gap-12">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <span
                key={i}
                className="whitespace-nowrap text-lg font-semibold tracking-tight text-mist/50"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
