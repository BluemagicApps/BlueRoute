"use client";

import { useMemo, useState } from "react";
import { Leaf, TreePine, CircleDollarSign, Ship } from "lucide-react";
import { cn } from "@/lib/utils";

const LANES = [
  { label: "Shanghai → Rotterdam", km: 19500 },
  { label: "Singapore → Los Angeles", km: 14000 },
  { label: "Shenzhen → New York", km: 18000 },
  { label: "Jebel Ali (Dubai) → Hamburg", km: 11000 },
  { label: "Santos → Antwerp", km: 9500 },
];

// ~12 g CO₂ per TEU-km baseline; Green Route slow-steams + biofuels (−26%).
function co2KgFor(km: number, teu: number, green: boolean) {
  const base = km * teu * 0.012;
  return Math.round(base * (green ? 0.74 : 1));
}

export function CarbonEstimator() {
  const [laneIdx, setLaneIdx] = useState(0);
  const [teu, setTeu] = useState(4);
  const [green, setGreen] = useState(true);

  const lane = LANES[laneIdx];
  const { co2Kg, trees, offsetUsd, savedKg } = useMemo(() => {
    const co2Kg = co2KgFor(lane.km, teu, green);
    const standardKg = co2KgFor(lane.km, teu, false);
    return {
      co2Kg,
      savedKg: standardKg - co2Kg,
      trees: Math.round(co2Kg / 21), // ~21 kg CO₂/tree/yr
      offsetUsd: Math.round((co2Kg / 1000) * 15), // ~$15 / tonne
    };
  }, [lane, teu, green]);

  const tonnes = (co2Kg / 1000).toFixed(1);

  return (
    <div className="grid gap-5 overflow-hidden rounded-3xl border border-emerald/25 bg-gradient-to-br from-emerald/8 to-teal/8 p-6 md:grid-cols-2 md:p-8">
      {/* Inputs */}
      <div>
        <h3
          className="flex items-center gap-2 text-lg font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <Leaf className="h-5 w-5 text-emerald" /> Carbon estimator
        </h3>
        <p className="mt-1 text-sm text-mist">
          See the footprint of a shipment — and what the Green Route saves.
        </p>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-sm font-medium text-foam">Trade lane</span>
          <select
            value={laneIdx}
            onChange={(e) => setLaneIdx(Number(e.target.value))}
            className="h-12 w-full rounded-2xl border border-steel/70 bg-white px-4 text-sm text-foam outline-none focus:border-emerald/60"
          >
            {LANES.map((l, i) => (
              <option key={l.label} value={i}>
                {l.label} (~{l.km.toLocaleString()} km)
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-foam">
            Containers (TEU) <span className="text-emerald">{teu}</span>
          </span>
          <input
            type="range"
            min={1}
            max={50}
            value={teu}
            onChange={(e) => setTeu(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { id: false, label: "Standard" },
            { id: true, label: "Green Route" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => setGreen(opt.id)}
              className={cn(
                "rounded-2xl border py-2.5 text-sm font-medium transition-colors",
                green === opt.id
                  ? "border-emerald/60 bg-emerald/10 text-emerald"
                  : "border-steel/70 bg-white text-mist hover:border-emerald/30"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col justify-center rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald">
          <Ship className="h-4 w-4" /> Estimated footprint
        </div>
        <p
          className="mt-2 text-4xl font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {tonnes} t<span className="text-xl text-mist"> CO₂e</span>
        </p>
        {green && savedKg > 0 && (
          <p className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-0.5 text-xs font-semibold text-emerald">
            <Leaf className="h-3.5 w-3.5" /> Saves {(savedKg / 1000).toFixed(1)} t vs standard
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-abyss p-3">
            <TreePine className="h-5 w-5 text-emerald" />
            <p className="mt-2 text-lg font-semibold text-foam">{trees.toLocaleString()}</p>
            <p className="text-xs text-mist">trees / yr to absorb</p>
          </div>
          <div className="rounded-2xl bg-abyss p-3">
            <CircleDollarSign className="h-5 w-5 text-teal" />
            <p className="mt-2 text-lg font-semibold text-foam">${offsetUsd.toLocaleString()}</p>
            <p className="text-xs text-mist">to fully offset</p>
          </div>
        </div>

        <button className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-emerald to-teal px-5 py-3 text-sm font-semibold text-white transition-transform active:scale-95">
          Offset this shipment
        </button>
      </div>
    </div>
  );
}
