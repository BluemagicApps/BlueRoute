"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Facility } from "@/lib/warehouse-data";
import { BASEMAP_STYLE } from "@/lib/map";

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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, { el: HTMLDivElement; marker: maplibregl.Marker }>>({});
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);

  // Keep the latest onSelect without re-initializing the map.
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [10, 25],
      zoom: 1.4,
      attributionControl: { compact: true },
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
    if (!map) return;

    Object.values(markersRef.current).forEach((m) => m.marker.remove());
    markersRef.current = {};

    facilities.forEach((f) => {
      const el = document.createElement("div");
      el.className = "br-wh-marker";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(f.id);
      });
      const marker = new maplibregl.Marker({ element: el }).setLngLat(f.coord).addTo(map);
      markersRef.current[f.id] = { el, marker };
    });

    if (facilities.length) {
      const bounds = facilities.reduce(
        (b, f) => b.extend(f.coord),
        new maplibregl.LngLatBounds(facilities[0].coord, facilities[0].coord),
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 5, duration: 600 });
    }
  }, [facilities, ready]);

  // Highlight + fly to the selected facility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.entries(markersRef.current).forEach(([id, { el }]) => {
      el.classList.toggle("is-active", id === selectedId);
    });
    const sel = facilities.find((f) => f.id === selectedId);
    if (sel) map.flyTo({ center: sel.coord, zoom: 5, duration: 900 });
  }, [selectedId, facilities, ready]);

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
