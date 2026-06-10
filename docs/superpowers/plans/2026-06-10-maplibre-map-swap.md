# MapLibre Map Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Mapbox GL with MapLibre GL + free CARTO Positron tiles so the tracking and warehouse maps render with no API token.

**Architecture:** MapLibre GL is an API-compatible fork; swap the import to `import * as maplibregl from "maplibre-gl"` (MapLibre has **no default export**), point the style at a free CARTO Positron URL, remove the token gate and fallback components, and add a compact attribution control. Extract the route-split logic into a pure, tested helper.

**Tech Stack:** Next.js 16.2.7, React 19, `maplibre-gl` 5.24.0 (already installed), Vitest, TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-10-maplibre-map-swap-design.md`

---

## Key API facts (verified against installed packages)

- **Import:** `import * as maplibregl from "maplibre-gl"` — there is NO default export. `import maplibregl from "maplibre-gl"` would be a type error. Keep all `maplibregl.Map` / `.Marker` / `.Popup` / `.LngLatBounds` references.
- **CSS:** `import "maplibre-gl/dist/maplibre-gl.css"`.
- `cooperativeGestures?: boolean` (so `cooperativeGestures: true` is valid).
- `attributionControl?: false | AttributionControlOptions` (so `{ compact: true }` is valid).
- `LngLat = [number, number]` is exported from `src/lib/tracking-data.ts`.

---

## File structure

**New:**
- `src/lib/map.ts` — `BASEMAP_STYLE` constant + `splitRouteAtVessel` pure helper.
- `src/lib/map.test.ts` — unit tests.

**Modified:**
- `src/components/tracking/shipment-map.tsx` — MapLibre swap, use helper, drop fallback.
- `src/components/warehouse/warehouse-map.tsx` — MapLibre swap, drop fallback.
- `src/app/globals.css` — rename `.mapboxgl-popup-*` → `.maplibregl-popup-*`.
- `package.json` — remove `mapbox-gl` + `@types/mapbox-gl`.

---

### Task 1: Shared basemap constant + route-split helper

**Files:**
- Create: `src/lib/map.ts`
- Test: `src/lib/map.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/map.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { BASEMAP_STYLE, splitRouteAtVessel } from "./map";
import type { LngLat } from "@/lib/tracking-data";

const route: LngLat[] = [
  [0, 0],
  [10, 0],
  [20, 0],
  [30, 0],
  [40, 0],
];

describe("BASEMAP_STYLE", () => {
  it("is a CARTO Positron https style URL", () => {
    expect(BASEMAP_STYLE).toMatch(/^https:\/\//);
    expect(BASEMAP_STYLE).toContain("positron");
  });
});

describe("splitRouteAtVessel", () => {
  it("splits at the vessel vertex, overlapping by one point", () => {
    const { traveled, remaining } = splitRouteAtVessel(route, [20, 0]);
    expect(traveled).toEqual([[0, 0], [10, 0], [20, 0]]);
    expect(remaining).toEqual([[20, 0], [30, 0], [40, 0]]);
  });

  it("falls back to the midpoint when the vessel is not a vertex", () => {
    const { traveled, remaining } = splitRouteAtVessel(route, [12.3, 4.5]);
    // Math.ceil(5 * 0.5) = 3 → cut at index 3
    expect(traveled).toEqual([[0, 0], [10, 0], [20, 0]]);
    expect(remaining).toEqual([[20, 0], [30, 0], [40, 0]]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/map`
Expected: FAIL — cannot find module `./map`.

- [ ] **Step 3: Implement the helper**

`src/lib/map.ts`:
```ts
import type { LngLat } from "@/lib/tracking-data";

/** Free CARTO Positron basemap (light, OSM-based, no API key required). */
export const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/**
 * Split a route into "traveled" and "remaining" segments at the vessel's
 * position. The two segments overlap by one point so the drawn lines join.
 * If the vessel is not an exact route vertex, splits at the route midpoint.
 */
export function splitRouteAtVessel(
  route: LngLat[],
  vessel: LngLat,
): { traveled: LngLat[]; remaining: LngLat[] } {
  const vIdx = route.findIndex((c) => c[0] === vessel[0] && c[1] === vessel[1]);
  const cut = vIdx >= 0 ? vIdx + 1 : Math.ceil(route.length * 0.5);
  return { traveled: route.slice(0, cut), remaining: route.slice(cut - 1) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/map`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/lib/map.ts src/lib/map.test.ts
git commit -m "Add shared basemap style and route-split helper"
```

---

### Task 2: Swap the shipment map to MapLibre

**Files:**
- Modify: `src/components/tracking/shipment-map.tsx`

Replace the **entire file** with the version below. Changes: `mapbox-gl` → `import * as maplibregl from "maplibre-gl"`; style is `BASEMAP_STYLE`; the route split uses `splitRouteAtVessel`; `attributionControl: { compact: true }`; the `TOKEN`/`HAS_TOKEN` gate and the `MapFallback` component are removed; unused `MapPin`/`Navigation` imports dropped.

- [ ] **Step 1: Replace `src/components/tracking/shipment-map.tsx`**

```tsx
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
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit` then `npx eslint src/components/tracking/shipment-map.tsx`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```powershell
git add src/components/tracking/shipment-map.tsx
git commit -m "Swap shipment map to MapLibre + CARTO tiles"
```

---

### Task 3: Swap the warehouse map to MapLibre

**Files:**
- Modify: `src/components/warehouse/warehouse-map.tsx`

Replace the **entire file** with the version below. Changes: `mapbox-gl` → `import * as maplibregl from "maplibre-gl"`; style `BASEMAP_STYLE`; `attributionControl: { compact: true }`; the `TOKEN`/`HAS_TOKEN` gate and `MapFallback` removed; the now-unused `lucide-react` import dropped.

- [ ] **Step 1: Replace `src/components/warehouse/warehouse-map.tsx`**

```tsx
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
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit` then `npx eslint src/components/warehouse/warehouse-map.tsx`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```powershell
git add src/components/warehouse/warehouse-map.tsx
git commit -m "Swap warehouse map to MapLibre + CARTO tiles"
```

---

### Task 4: Rename Mapbox popup CSS to MapLibre

**Files:**
- Modify: `src/app/globals.css`

MapLibre emits `.maplibregl-*` class names instead of `.mapboxgl-*`, so the popup overrides must be renamed or they stop applying.

- [ ] **Step 1: Update the comment header**

In `src/app/globals.css`, change:
```css
/* ------------------------------------------------------------
   Mapbox markers + popups (custom DOM elements)
   ------------------------------------------------------------ */
```
to:
```css
/* ------------------------------------------------------------
   MapLibre markers + popups (custom DOM elements)
   ------------------------------------------------------------ */
```

- [ ] **Step 2: Rename the popup selectors**

In `src/app/globals.css`, change:
```css
/* Dark Mapbox popups */
.mapboxgl-popup-content {
```
to:
```css
/* Dark MapLibre popups */
.maplibregl-popup-content {
```

And change:
```css
.mapboxgl-popup-tip {
```
to:
```css
.maplibregl-popup-tip {
```

- [ ] **Step 3: Verify no `.mapboxgl-` selectors remain**

Run: `npx eslint src 2>$null; Select-String -Path src/app/globals.css -Pattern "mapboxgl"`
Expected: no matches for `mapboxgl`.

- [ ] **Step 4: Commit**

```powershell
git add src/app/globals.css
git commit -m "Rename Mapbox popup styles to MapLibre"
```

---

### Task 5: Remove the Mapbox dependency and verify

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Uninstall the Mapbox packages**

Run in PowerShell at repo root:
```powershell
npm uninstall mapbox-gl @types/mapbox-gl
```
Expected: `package.json` no longer lists `mapbox-gl` or `@types/mapbox-gl`.

- [ ] **Step 2: Confirm no Mapbox references remain in source**

Run: `Get-ChildItem src -Recurse -File | Select-String -Pattern "mapbox"`
Expected: no matches (the `NEXT_PUBLIC_MAPBOX_TOKEN` line in `.env.local` is not under `src` and is fine to leave).

- [ ] **Step 3: Full verification**

Run: `npm test` then `npx tsc --noEmit` then `npm run build`
Expected: all tests pass (existing 33 + 3 new = 36), no type errors, build succeeds.

- [ ] **Step 4: Manual map check**

Run `npm run dev`, then:
1. Open http://localhost:3000/tracking — expect a light interactive map with the blue traveled line, dashed remaining line, port markers (click one → dark popup), the pulsing vessel marker, fit to the route, and a small attribution chip (bottom corner).
2. Open http://localhost:3000/warehousing — expect clickable facility pins on a light map, the view fitting to the visible facilities, and a smooth fly-to + highlight when you select a facility from the list.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json
git commit -m "Remove unused Mapbox dependency"
```

---

## Notes for the implementer

- **No default export:** `import * as maplibregl from "maplibre-gl"` is required — `import maplibregl from "maplibre-gl"` will not typecheck.
- The `.br-port-marker` / `.br-vessel-marker` / `.br-wh-marker` marker styles in `globals.css` are unchanged — DOM markers work identically in MapLibre.
- No network token is needed; the CARTO style and tiles are public. If you are fully offline, the basemap will be blank but the page stays usable.
