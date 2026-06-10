import { Check, X } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const ROWS = [
  {
    label: "ETA accuracy",
    legacy: "Static schedules, updated after delays",
    blue: "Predictive ETAs with live confidence scoring",
  },
  {
    label: "Disruptions",
    legacy: "Reactive emails once cargo is stuck",
    blue: "Detected early & auto-re-routed",
  },
  {
    label: "Quoting",
    legacy: "Hours to days, manual back-and-forth",
    blue: "AI-optimized rates in under 60 seconds",
  },
  {
    label: "Visibility",
    legacy: "Clunky portals, delayed updates",
    blue: "Real-time map, IoT sensors, mobile-first",
  },
  {
    label: "Warehousing",
    legacy: "Disconnected, separate vendors",
    blue: "AI-matched smart facilities, fully integrated",
  },
];

export function Advantage() {
  return (
    <section className="relative py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow="Why Blue Route"
          title={
            <>
              The gap between <span className="text-mist">legacy carriers</span> and{" "}
              <span className="text-gradient">the AI Edge</span>
            </>
          }
          subtitle="The same lanes. A fundamentally smarter way to run them."
        />

        <Reveal className="mt-14">
          <div className="overflow-hidden rounded-3xl border border-steel/50">
            {/* Header row */}
            <div className="grid grid-cols-3 border-b border-steel/50 bg-deep/60">
              <div className="p-5 text-sm font-medium text-mist">Capability</div>
              <div className="p-5 text-sm font-semibold text-mist/80">
                Legacy carriers
              </div>
              <div className="relative p-5 text-sm font-semibold text-cyan">
                <span className="absolute inset-0 bg-cyan/5" />
                <span className="relative">Blue Route</span>
              </div>
            </div>

            {ROWS.map((r, i) => (
              <div
                key={r.label}
                className={`grid grid-cols-3 items-center ${
                  i !== ROWS.length - 1 ? "border-b border-steel/40" : ""
                }`}
              >
                <div className="p-5 text-sm font-medium text-foam">{r.label}</div>
                <div className="flex items-start gap-2 p-5 text-sm text-mist">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-mist/50" />
                  {r.legacy}
                </div>
                <div className="relative flex items-start gap-2 p-5 text-sm text-foam">
                  <span className="absolute inset-0 bg-cyan/5" />
                  <Check className="relative mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                  <span className="relative">{r.blue}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
