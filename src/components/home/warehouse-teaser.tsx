import { MapPin, Ruler, Zap, Truck, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

const SPECS = [
  { icon: Ruler, label: "12,000–250,000 ft²" },
  { icon: Zap, label: "Heavy power + solar" },
  { icon: Truck, label: "Cross-dock & EV bays" },
  { icon: MapPin, label: "Near major ports" },
];

export function WarehouseTeaser() {
  return (
    <section className="relative py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-float" />
              Warehouse Leasing
            </span>
            <h2
              className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-foam md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Smart space, <span className="text-gradient">matched by AI</span> to
              how you ship
            </h2>
            <p className="mt-4 max-w-lg text-mist">
              Search a live map of smart facilities, filter by location, size, and
              features, then let our AI recommend the right footprint near your
              demand — with availability calendars and a built-in leasing
              calculator.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              {SPECS.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="flex items-center gap-3 rounded-2xl border border-steel/50 bg-deep/40 px-4 py-3"
                  >
                    <Icon className="h-5 w-5 text-cyan" />
                    <span className="text-sm text-foam">{s.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <Button href="/warehousing" variant="primary" size="lg">
                Explore facilities
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Reveal>

          {/* Map mock */}
          <Reveal delay={0.1}>
            <div className="glass relative aspect-[4/3] overflow-hidden rounded-3xl p-1">
              <div className="bg-grid relative h-full w-full overflow-hidden rounded-[1.35rem] bg-abyss">
                <div className="absolute inset-0 bg-gradient-to-br from-navy/30 to-transparent" />
                {/* Pins */}
                {[
                  { x: "22%", y: "30%", d: "0s" },
                  { x: "60%", y: "22%", d: "0.4s" },
                  { x: "44%", y: "55%", d: "0.8s" },
                  { x: "75%", y: "62%", d: "1.2s" },
                  { x: "33%", y: "74%", d: "1.6s" },
                ].map((p, i) => (
                  <span
                    key={i}
                    className="absolute"
                    style={{ left: p.x, top: p.y }}
                  >
                    <span className="relative grid place-items-center">
                      <span
                        className="absolute h-8 w-8 rounded-full bg-cyan/30 animate-float"
                        style={{ animationDelay: p.d }}
                      />
                      <MapPin className="relative h-6 w-6 text-cyan drop-shadow-[0_0_8px_rgba(0,191,255,0.7)]" />
                    </span>
                  </span>
                ))}
                {/* Floating facility card */}
                <div className="glass absolute bottom-4 left-4 right-4 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foam">
                        Rotterdam Smart Hub A
                      </p>
                      <p className="text-xs text-mist">
                        84,000 ft² · 12m clear · 18 docks
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan/15 px-3 py-1 text-xs font-semibold text-cyan">
                      Available
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
