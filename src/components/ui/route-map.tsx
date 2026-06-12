"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { BASEMAP_STYLE, buildTripPath, type LngLat } from "@/lib/map";

export type RoutePoint = { name: string; lng: number; lat: number };

/**
 * Animated trip map: great-circle line origin→destination, the traveled
 * segment draws itself in, pulsing marker at the current position.
 * Degrades to a single-pin map (current only) or a styled placeholder.
 */
export function RouteMap({
  origin,
  destination,
  current,
  progressPct,
  className = "h-[420px]",
}: {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  current: RoutePoint | null;
  progressPct: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  const hasRoute = Boolean(origin && destination);
  const hasAnything = hasRoute || Boolean(current);

  useEffect(() => {
    if (!hasAnything || !containerRef.current || mapRef.current) return;

    const center: LngLat = current
      ? [current.lng, current.lat]
      : [origin!.lng, origin!.lat];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center,
      zoom: hasRoute ? 2 : 8,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    mapRef.current = map;
    let raf = 0;

    map.on("load", () => {
      setReady(true);

      const addMarker = (p: RoutePoint, cls: string) => {
        const el = document.createElement("div");
        el.className = cls;
        el.title = p.name;
        // Build the popup via DOM text (not setHTML) so place names can't inject markup.
        const label = document.createElement("strong");
        label.textContent = p.name;
        new maplibregl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 14, closeButton: false }).setDOMContent(label),
          )
          .addTo(map);
      };

      if (origin) addMarker(origin, "br-port-marker");
      if (destination) addMarker(destination, "br-port-marker");
      if (current) addMarker(current, "br-vessel-marker");

      if (hasRoute) {
        const { traveled, remaining } = buildTripPath(
          [origin!.lng, origin!.lat],
          [destination!.lng, destination!.lat],
          current ? [current.lng, current.lat] : null,
          progressPct,
        );

        map.addSource("remaining", { type: "geojson", data: line(remaining) });
        map.addLayer({
          id: "remaining",
          type: "line",
          source: "remaining",
          paint: {
            "line-color": "#5b8cff",
            "line-width": 2.5,
            "line-opacity": 0.5,
            "line-dasharray": [1, 2],
          },
        });

        map.addSource("traveled", { type: "geojson", data: line([traveled[0] ?? [0, 0]]) });
        map.addLayer({
          id: "traveled",
          type: "line",
          source: "traveled",
          paint: { "line-color": "#1e5bff", "line-width": 3 },
        });

        // Animate the traveled segment drawing in (~1.8s, respects reduced motion).
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const src = map.getSource("traveled") as maplibregl.GeoJSONSource;
        if (reduced || traveled.length < 2) {
          src.setData(line(traveled));
        } else {
          const t0 = performance.now();
          const DURATION = 1800;
          const tick = (t: number) => {
            const f = Math.min(1, (t - t0) / DURATION);
            const count = Math.max(1, Math.round(traveled.length * f));
            src.setData(line(traveled.slice(0, count)));
            if (f < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }

        const all = [...traveled, ...remaining];
        const bounds = all.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(all[0], all[0]),
        );
        map.fitBounds(bounds, { padding: 70, duration: 0 });
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lng, origin?.lat, destination?.lng, destination?.lat, current?.lng, current?.lat, progressPct]);

  if (!hasAnything) {
    return (
      <div className={`grid place-items-center rounded-[1.35rem] border border-steel/70 bg-navy ${className}`}>
        <p className="px-6 text-center text-sm text-mist">
          Route map appears once the shipment&apos;s coordinates are set.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-[1.35rem] ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-abyss/60">
          <span className="text-sm text-mist">Loading map…</span>
        </div>
      )}
      {hasRoute && (
        <div className="glass pointer-events-none absolute bottom-3 left-3 flex items-center gap-4 rounded-xl px-3 py-2 text-xs text-mist">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-cyan" /> Traveled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-aqua/50" /> Remaining
          </span>
        </div>
      )}
    </div>
  );
}

function line(coords: LngLat[]): GeoJSON.Feature {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: coords },
  };
}
