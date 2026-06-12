"use client";

import { useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import { geocodeCity } from "@/lib/geocode";

const inputCls =
  "w-full rounded-2xl border border-steel bg-deep px-3.5 py-2.5 text-sm text-foam outline-none focus:border-cyan placeholder:text-mist/60";

/**
 * Lng/lat input pair with a "Find coordinates" assist that geocodes the
 * related place text (free Open-Meteo lookup) and fills both fields.
 */
export function CoordFields({
  prefix,
  label,
  getQuery,
  defaultLng,
  defaultLat,
  error,
  onChange,
}: {
  prefix: "origin" | "destination";
  label: string;
  getQuery: () => string;
  defaultLng?: number | null;
  defaultLat?: number | null;
  error?: string;
  onChange?: (lng: string, lat: string) => void;
}) {
  const [lng, setLng] = useState(defaultLng?.toString() ?? "");
  const [lat, setLat] = useState(defaultLat?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function lookup() {
    const q = getQuery();
    if (!q) {
      setNote("Type the place name first.");
      return;
    }
    setBusy(true);
    setNote(null);
    const hit = await geocodeCity(q);
    setBusy(false);
    if (!hit) {
      setNote("No match found — enter coordinates manually.");
      return;
    }
    const lngS = hit.lng.toFixed(4);
    const latS = hit.lat.toFixed(4);
    setLng(lngS);
    setLat(latS);
    onChange?.(lngS, latS);
  }

  return (
    <div className="md:col-span-2">
      <div className="flex items-end justify-between gap-3">
        <span className="text-sm font-medium text-foam">{label}</span>
        <button
          type="button"
          onClick={lookup}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-steel px-3 py-1.5 text-xs font-semibold text-cyan hover:border-cyan/50 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          Find coordinates
        </button>
      </div>
      <div className="mt-1.5 grid gap-4 md:grid-cols-2">
        <input
          name={`${prefix}_lng`}
          value={lng}
          onChange={(e) => {
            setLng(e.target.value);
            onChange?.(e.target.value, lat);
          }}
          placeholder="Longitude"
          inputMode="decimal"
          className={inputCls}
        />
        <input
          name={`${prefix}_lat`}
          value={lat}
          onChange={(e) => {
            setLat(e.target.value);
            onChange?.(lng, e.target.value);
          }}
          placeholder="Latitude"
          inputMode="decimal"
          className={inputCls}
        />
      </div>
      {(note || error) && (
        <span className="mt-1 block text-xs text-rose">{error ?? note}</span>
      )}
    </div>
  );
}
