import { TrendingDown, AlertTriangle, Route as RouteIcon, Leaf } from "lucide-react";

const ALTERNATES = [
  { name: "ANE Express (via Suez)", risk: 8, transit: "28d", tone: "emerald" },
  { name: "Cape of Good Hope reroute", risk: 14, transit: "37d", tone: "cyan" },
  { name: "Rail + Sea (China–EU)", risk: 22, transit: "24d", tone: "amber" },
];

const FORECAST = [62, 58, 54, 49, 47, 44, 46, 43]; // indexed freight cost

const TONE: Record<string, string> = {
  emerald: "bg-emerald",
  cyan: "bg-cyan",
  amber: "bg-amber",
};

export function PredictiveDashboard() {
  const max = Math.max(...FORECAST);
  const min = Math.min(...FORECAST);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Delay probability gauge */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-foam">
          <AlertTriangle className="h-4 w-4 text-amber" /> Delay probability
        </div>
        <div className="mt-5 grid place-items-center">
          <Gauge value={12} />
        </div>
        <p className="mt-4 text-center text-xs text-mist">
          Low risk this week. Model watches 40+ live signals per lane.
        </p>
      </div>

      {/* Route alternatives */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-foam">
          <RouteIcon className="h-4 w-4 text-cyan" /> Route alternatives
        </div>
        <ul className="mt-4 space-y-3">
          {ALTERNATES.map((a) => (
            <li key={a.name}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foam">{a.name}</span>
                <span className="text-mist">{a.transit}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-steel/60">
                  <div
                    className={`h-full rounded-full ${TONE[a.tone]}`}
                    style={{ width: `${a.risk * 3}%` }}
                  />
                </div>
                <span className="w-12 text-right text-[0.7rem] text-mist">{a.risk}% risk</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Cost forecast */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foam">
            <TrendingDown className="h-4 w-4 text-emerald" /> Cost forecast
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-0.5 text-[0.7rem] font-semibold text-emerald">
            <Leaf className="h-3 w-3" /> −13%
          </span>
        </div>
        <div className="mt-6 flex h-28 items-end gap-1.5">
          {FORECAST.map((v, i) => {
            const h = 30 + ((v - min) / (max - min || 1)) * 70;
            return (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-cyan to-indigo"
                style={{ height: `${h}%`, opacity: 0.55 + (i / FORECAST.length) * 0.45 }}
              />
            );
          })}
        </div>
        <p className="mt-3 text-xs text-mist">
          Projected 8-week freight index for your lane — buy now or wait, advised.
        </p>
      </div>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 52;
  const circ = Math.PI * r; // semicircle
  const offset = circ * (1 - value / 100);
  return (
    <svg viewBox="0 0 140 80" className="w-44">
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="60%" stopColor="#1e5bff" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        d="M18 70 A52 52 0 0 1 122 70"
        fill="none"
        stroke="#e4e9f0"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M18 70 A52 52 0 0 1 122 70"
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
      <text x="70" y="58" textAnchor="middle" className="fill-foam" style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)" }}>
        {value}%
      </text>
    </svg>
  );
}
