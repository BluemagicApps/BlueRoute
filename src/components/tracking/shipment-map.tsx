"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Ship, Navigation } from "lucide-react";
import type { Shipment } from "@/lib/tracking-data";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const HAS_TOKEN = TOKEN.startsWith("pk.");

export function ShipmentMap({ shipment }: { shipment: Shipment }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!HAS_TOKEN || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: shipment.vesselPosition,
      zoom: 2.4,
      attributionControl: false,
      cooperativeGestures: true,
    });
    mapRef.current = map;

    map.on("load", () => {
      setReady(true);

      // Split route into "traveled" and "remaining" at the vessel position.
      const vIdx = shipment.route.findIndex(
        (c) =>
          c[0] === shipment.vesselPosition[0] &&
          c[1] === shipment.vesselPosition[1]
      );
      const cut = vIdx >= 0 ? vIdx + 1 : Math.ceil(shipment.route.length * 0.5);
      const traveled = shipment.route.slice(0, cut);
      const remaining = shipment.route.slice(cut - 1);

      map.addSource("remaining", {
        type: "geojson",
        data: lineFeature(remaining),
      });
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

      map.addSource("traveled", {
        type: "geojson",
        data: lineFeature(traveled),
      });
      map.addLayer({
        id: "traveled",
        type: "line",
        source: "traveled",
        paint: { "line-color": "#1e5bff", "line-width": 3 },
      });

      // Port markers
      shipment.ports.forEach((p) => {
        const el = document.createElement("div");
        el.className = "br-port-marker";
        el.title = `${p.name} (${p.code})`;
        new mapboxgl.Marker({ element: el })
          .setLngLat(p.coord)
          .setPopup(
            new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(
              `<strong>${p.name}</strong><br/>${p.code}`
            )
          )
          .addTo(map);
      });

      // Vessel marker (pulsing)
      const vEl = document.createElement("div");
      vEl.className = "br-vessel-marker";
      new mapboxgl.Marker({ element: vEl })
        .setLngLat(shipment.vesselPosition)
        .addTo(map);

      // Fit to the full route
      const bounds = shipment.route.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(shipment.route[0], shipment.route[0])
      );
      map.fitBounds(bounds, { padding: 70, duration: 0 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [shipment]);

  if (!HAS_TOKEN) {
    return <MapFallback shipment={shipment} />;
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-abyss/60">
          <span className="text-sm text-mist">Loading live map…</span>
        </div>
      )}
      {/* Legend */}
      <div className="glass pointer-events-none absolute bottom-3 left-3 flex items-center gap-4 rounded-xl px-3 py-2 text-xs text-mist">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-cyan" /> Traveled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-aqua/50" /> Remaining
        </span>
        <span className="flex items-center gap-1.5">
          <Ship className="h-3.5 w-3.5 text-cyan" /> Vessel
        </span>
      </div>
    </div>
  );
}

function lineFeature(coords: [number, number][]): GeoJSON.Feature {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: coords },
  };
}

/** Shown when no Mapbox token is configured — keeps the page usable. */
function MapFallback({ shipment }: { shipment: Shipment }) {
  return (
    <div className="bg-grid relative grid h-full w-full place-items-center overflow-hidden bg-abyss">
      <div className="absolute inset-0 bg-gradient-to-br from-navy/40 to-transparent" />
      <div className="relative max-w-sm px-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan/15 text-cyan">
          <Navigation className="h-7 w-7" />
        </span>
        <h3
          className="mt-4 text-lg font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Live map ready to activate
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          Add your free Mapbox token to{" "}
          <code className="rounded bg-steel/60 px-1.5 py-0.5 text-aqua">
            .env.local
          </code>{" "}
          and the interactive vessel map appears here instantly.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-mist">
          <MapPin className="h-3.5 w-3.5 text-cyan" />
          {shipment.origin.name} → {shipment.destination.name} ·{" "}
          {shipment.progressPct}% complete
        </div>
      </div>
    </div>
  );
}
