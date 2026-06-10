"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Ship } from "lucide-react";
import type { Shipment } from "@/lib/tracking-data";
import { BASEMAP_STYLE, splitRouteAtVessel } from "@/lib/map";

export function ShipmentMap({ shipment }: { shipment: Shipment }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: shipment.vesselPosition,
      zoom: 2.4,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    mapRef.current = map;

    map.on("load", () => {
      setReady(true);

      const { traveled, remaining } = splitRouteAtVessel(
        shipment.route,
        shipment.vesselPosition,
      );

      map.addSource("remaining", { type: "geojson", data: lineFeature(remaining) });
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

      map.addSource("traveled", { type: "geojson", data: lineFeature(traveled) });
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
        new maplibregl.Marker({ element: el })
          .setLngLat(p.coord)
          .setPopup(
            new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
              `<strong>${p.name}</strong><br/>${p.code}`,
            ),
          )
          .addTo(map);
      });

      // Vessel marker (pulsing)
      const vEl = document.createElement("div");
      vEl.className = "br-vessel-marker";
      new maplibregl.Marker({ element: vEl }).setLngLat(shipment.vesselPosition).addTo(map);

      // Fit to the full route
      const bounds = shipment.route.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(shipment.route[0], shipment.route[0]),
      );
      map.fitBounds(bounds, { padding: 70, duration: 0 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [shipment]);

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
