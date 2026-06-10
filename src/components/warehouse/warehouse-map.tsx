"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Navigation } from "lucide-react";
import type { Facility } from "@/lib/warehouse-data";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const HAS_TOKEN = TOKEN.startsWith("pk.");

export function WarehouseMap({
  facilities,
  selectedId,
  onSelect,
}: {
  facilities: Facility[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, { el: HTMLDivElement; marker: mapboxgl.Marker }>>({});
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);

  // Keep the latest onSelect without re-initializing the map.
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Init map once.
  useEffect(() => {
    if (!HAS_TOKEN || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [10, 25],
      zoom: 1.4,
      attributionControl: false,
      cooperativeGestures: true,
    });
    mapRef.current = map;
    map.on("load", () => setReady(true));
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // (Re)build markers when the visible facility set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!HAS_TOKEN || !map) return;

    Object.values(markersRef.current).forEach((m) => m.marker.remove());
    markersRef.current = {};

    facilities.forEach((f) => {
      const el = document.createElement("div");
      el.className = "br-wh-marker";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(f.id);
      });
      const marker = new mapboxgl.Marker({ element: el }).setLngLat(f.coord).addTo(map);
      markersRef.current[f.id] = { el, marker };
    });

    if (facilities.length) {
      const bounds = facilities.reduce(
        (b, f) => b.extend(f.coord),
        new mapboxgl.LngLatBounds(facilities[0].coord, facilities[0].coord)
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 5, duration: 600 });
    }
  }, [facilities, ready]);

  // Highlight + fly to the selected facility.
  useEffect(() => {
    const map = mapRef.current;
    if (!HAS_TOKEN || !map) return;
    Object.entries(markersRef.current).forEach(([id, { el }]) => {
      el.classList.toggle("is-active", id === selectedId);
    });
    const sel = facilities.find((f) => f.id === selectedId);
    if (sel) map.flyTo({ center: sel.coord, zoom: 5, duration: 900 });
  }, [selectedId, facilities, ready]);

  if (!HAS_TOKEN) {
    return <MapFallback facilities={facilities} selectedId={selectedId} onSelect={onSelect} />;
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-abyss/60">
          <span className="text-sm text-mist">Loading facilities map…</span>
        </div>
      )}
    </div>
  );
}

/* World-scatter fallback when no Mapbox token is set. */
function MapFallback({
  facilities,
  selectedId,
  onSelect,
}: {
  facilities: Facility[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="bg-grid relative h-full w-full overflow-hidden rounded-[inherit] bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-indigo/5" />
      {facilities.map((f) => {
        const x = ((f.coord[0] + 180) / 360) * 100;
        const y = ((90 - f.coord[1]) / 180) * 100;
        const active = f.id === selectedId;
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
            title={f.name}
          >
            <span className="relative grid place-items-center">
              {active && (
                <span className="absolute h-7 w-7 rounded-full bg-indigo/30 animate-float" />
              )}
              <MapPin
                className={`relative h-6 w-6 drop-shadow ${active ? "text-indigo" : "text-cyan"}`}
              />
            </span>
          </button>
        );
      })}
      <div className="glass absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-mist">
        <Navigation className="h-3.5 w-3.5 text-cyan" />
        Add a Mapbox token to <code className="rounded bg-steel/60 px-1 text-foam">.env.local</code> for the full interactive map. Pins are clickable.
      </div>
    </div>
  );
}
