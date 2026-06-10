import {
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  Download,
  Thermometer,
  Droplets,
  Activity,
  Lock,
  Plug,
  Satellite,
  AlertTriangle,
  Info,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Shipment } from "@/lib/tracking-data";
import { cn } from "@/lib/utils";

/* ---------- Shipment header ---------- */
export function ShipmentHeader({ s }: { s: Shipment }) {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan/15 px-3 py-1 text-xs font-semibold text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-float" />
            {s.carrierStatus}
          </span>
          <h1
            className="mt-3 text-2xl font-semibold tracking-tight text-foam md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {s.origin.name} → {s.destination.name}
          </h1>
          <p className="mt-1 text-sm text-mist">
            {s.vesselName} · Voyage {s.voyage} · {s.service}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Meta label="Container" value={s.container} />
          <Meta label="B/L" value={s.bl} />
          <Meta label="Reference" value={s.reference} />
          <Meta label="Container type" value={s.cargo.containerType} />
        </dl>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-mist">
          <span>{s.origin.code}</span>
          <span>{s.progressPct}% complete</span>
          <span>{s.destination.code}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-steel/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-aqua to-cyan"
            style={{ width: `${s.progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.7rem] uppercase tracking-wider text-mist/70">{label}</dt>
      <dd className="font-medium text-foam">{value}</dd>
    </div>
  );
}

/* ---------- Predictive ETA ---------- */
export function EtaCard({ s }: { s: Shipment }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan/30 bg-gradient-to-br from-navy/80 to-deep p-6">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan/20 blur-2xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
          <Sparkles className="h-3.5 w-3.5" /> AI Predicted ETA
        </span>
        <p
          className="mt-3 text-2xl font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {s.eta.predicted}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/15 px-3 py-1 text-xs font-semibold capitalize text-cyan">
            <ShieldCheck className="h-3.5 w-3.5" />
            {s.eta.verdict}
          </span>
          <span className="text-xs text-mist">
            {s.eta.confidence}% confidence · scheduled {s.eta.scheduled}
          </span>
        </div>
        <p className="mt-4 rounded-xl bg-abyss/40 p-3 text-sm leading-relaxed text-mist">
          <span className="font-medium text-aqua">AI note:</span> {s.eta.note}
        </p>
      </div>
    </div>
  );
}

/* ---------- Timeline ---------- */
const STATUS_ICON: Record<string, LucideIcon> = {
  done: CheckCircle2,
  current: Loader2,
  upcoming: Circle,
};

export function Timeline({ s }: { s: Shipment }) {
  return (
    <Panel title="Shipment timeline">
      <ol className="relative space-y-5 pl-2">
        {s.timeline.map((e, i) => {
          const Icon = STATUS_ICON[e.status];
          const last = i === s.timeline.length - 1;
          return (
            <li key={e.id} className="relative flex gap-4">
              {!last && (
                <span
                  className={cn(
                    "absolute left-[11px] top-7 h-[calc(100%-4px)] w-px",
                    e.status === "done" ? "bg-cyan/50" : "bg-steel/60"
                  )}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-6 w-6 shrink-0",
                  e.status === "done" && "text-cyan",
                  e.status === "current" && "animate-spin-slow text-aqua",
                  e.status === "upcoming" && "text-mist/40"
                )}
              />
              <div className="pb-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    e.status === "upcoming" ? "text-mist" : "text-foam"
                  )}
                >
                  {e.title}
                </p>
                <p className="text-xs text-mist">
                  {e.location} · {e.timestamp}
                </p>
                {e.detail && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-cyan/10 px-2 py-0.5 text-[0.7rem] text-cyan">
                    <Sparkles className="h-3 w-3" /> {e.detail}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/* ---------- IoT sensors ---------- */
const SENSOR_ICON: Record<string, LucideIcon> = {
  Temperature: Thermometer,
  Humidity: Droplets,
  Shock: Activity,
  Door: Lock,
  Power: Plug,
  "GPS ping": Satellite,
};

export function Sensors({ s }: { s: Shipment }) {
  return (
    <Panel title="IoT sensor data" badge="Live">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {s.sensors.map((sensor) => {
          const Icon = SENSOR_ICON[sensor.label] ?? Activity;
          return (
            <div
              key={sensor.label}
              className="rounded-2xl border border-steel/50 bg-abyss/40 p-3"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-cyan" />
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    sensor.status === "ok" && "bg-emerald-400",
                    sensor.status === "warn" && "bg-amber-400",
                    sensor.status === "alert" && "bg-rose-500"
                  )}
                />
              </div>
              <p className="mt-2 text-lg font-semibold text-foam">{sensor.value}</p>
              <p className="text-[0.7rem] text-mist/70">{sensor.label}</p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ---------- Documents ---------- */
export function Documents({ s }: { s: Shipment }) {
  return (
    <Panel title="Documents">
      <ul className="space-y-2">
        {s.documents.map((d) => (
          <li key={d.name}>
            <button className="group flex w-full items-center gap-3 rounded-2xl border border-steel/50 bg-abyss/40 p-3 text-left transition-colors hover:border-cyan/40">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-steel/60 text-cyan">
                <FileText className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-foam">{d.name}</span>
                <span className="block text-xs text-mist">
                  {d.type} · {d.size}
                </span>
              </span>
              <Download className="h-4 w-4 text-mist transition-colors group-hover:text-cyan" />
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------- Alerts / exceptions ---------- */
export function Alerts({ s }: { s: Shipment }) {
  const styles = {
    info: { icon: Info, ring: "border-cyan/30", tint: "text-cyan" },
    warning: { icon: AlertTriangle, ring: "border-amber-400/40", tint: "text-amber-400" },
    resolved: { icon: ShieldCheck, ring: "border-emerald-400/40", tint: "text-emerald-400" },
  } as const;

  return (
    <Panel title="Exception management" badge="AI">
      <ul className="space-y-3">
        {s.alerts.map((a) => {
          const st = styles[a.severity];
          const Icon = st.icon;
          return (
            <li
              key={a.id}
              className={cn("rounded-2xl border bg-abyss/40 p-4", st.ring)}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", st.tint)} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foam">{a.title}</p>
                    <span className="text-[0.7rem] text-mist/70">{a.time}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-mist">{a.body}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ---------- Shared panel shell ---------- */
function Panel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-base font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        {badge && (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan/15 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-float" />
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
