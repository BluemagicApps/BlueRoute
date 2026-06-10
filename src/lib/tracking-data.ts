/**
 * Mock tracking dataset. Stands in for the real tracking API / WebSocket feed.
 * Coordinates are [lng, lat] to match Mapbox/GeoJSON ordering.
 */

export type LngLat = [number, number];

export type TimelineEvent = {
  id: string;
  title: string;
  location: string;
  timestamp: string;
  status: "done" | "current" | "upcoming";
  detail?: string;
};

export type SensorReading = {
  label: string;
  value: string;
  status: "ok" | "warn" | "alert";
  hint: string;
};

export type ShipmentDoc = {
  name: string;
  type: string;
  size: string;
};

export type Alert = {
  id: string;
  severity: "info" | "warning" | "resolved";
  title: string;
  body: string;
  time: string;
};

export type Shipment = {
  reference: string;
  container: string;
  bl: string;
  vesselName: string;
  voyage: string;
  service: string;
  carrierStatus: string;
  origin: { name: string; code: string; coord: LngLat };
  destination: { name: string; code: string; coord: LngLat };
  vesselPosition: LngLat;
  progressPct: number;
  route: LngLat[];
  ports: { name: string; code: string; coord: LngLat; type: "origin" | "transit" | "destination" }[];
  eta: {
    predicted: string;
    scheduled: string;
    confidence: number;
    verdict: "on-time" | "early" | "delayed";
    note: string;
  };
  cargo: { description: string; type: string; weight: string; containerType: string };
  timeline: TimelineEvent[];
  sensors: SensorReading[];
  documents: ShipmentDoc[];
  alerts: Alert[];
};

export const SAMPLE_SHIPMENT: Shipment = {
  reference: "BR-7741-2026",
  container: "BRLU 774120 3",
  bl: "BRLSHARTM2026A",
  vesselName: "MV Blue Meridian",
  voyage: "BM-118E",
  service: "Asia–North Europe Express (ANE)",
  carrierStatus: "In transit · on water",
  origin: { name: "Shanghai", code: "CNSHA", coord: [121.8, 31.2] },
  destination: { name: "Rotterdam", code: "NLRTM", coord: [4.13, 51.95] },
  vesselPosition: [43.2, 12.6], // Gulf of Aden region
  progressPct: 62,
  // Simplified great-circle-ish path Shanghai → Rotterdam via Suez
  route: [
    [121.8, 31.2],
    [110.4, 13.5],
    [103.8, 1.3],
    [80.2, 6.0],
    [60.5, 12.0],
    [43.2, 12.6],
    [33.9, 27.3],
    [32.3, 31.2],
    [14.5, 35.9],
    [5.4, 36.0],
    [-5.6, 36.0],
    [-9.5, 38.7],
    [-1.5, 46.5],
    [1.9, 49.6],
    [4.13, 51.95],
  ],
  ports: [
    { name: "Shanghai", code: "CNSHA", coord: [121.8, 31.2], type: "origin" },
    { name: "Singapore", code: "SGSIN", coord: [103.8, 1.3], type: "transit" },
    { name: "Suez Canal", code: "EGSUZ", coord: [32.3, 31.2], type: "transit" },
    { name: "Rotterdam", code: "NLRTM", coord: [4.13, 51.95], type: "destination" },
  ],
  eta: {
    predicted: "Jun 19, 2026 · 14:20 CET",
    scheduled: "Jun 19, 2026",
    confidence: 99,
    verdict: "on-time",
    note: "AI re-routed around Red Sea congestion, preserving the schedule.",
  },
  cargo: {
    description: "Lithium-ion battery modules (Class 9)",
    type: "Dangerous goods · temperature sensitive",
    weight: "21,400 kg",
    containerType: "40' High-Cube Reefer",
  },
  timeline: [
    {
      id: "t1",
      title: "Booking confirmed",
      location: "Shanghai, CN",
      timestamp: "Jun 1, 2026 · 09:12",
      status: "done",
    },
    {
      id: "t2",
      title: "Gate-in at origin terminal",
      location: "Yangshan Deep-Water Port",
      timestamp: "Jun 3, 2026 · 16:40",
      status: "done",
    },
    {
      id: "t3",
      title: "Loaded on MV Blue Meridian",
      location: "Shanghai, CN",
      timestamp: "Jun 4, 2026 · 02:05",
      status: "done",
    },
    {
      id: "t4",
      title: "Vessel departed",
      location: "Shanghai, CN",
      timestamp: "Jun 4, 2026 · 07:30",
      status: "done",
    },
    {
      id: "t5",
      title: "Transshipment call",
      location: "Singapore, SG",
      timestamp: "Jun 8, 2026 · 11:15",
      status: "done",
    },
    {
      id: "t6",
      title: "In transit — Gulf of Aden",
      location: "Indian Ocean",
      timestamp: "Now",
      status: "current",
      detail: "AI rerouting active · congestion avoided",
    },
    {
      id: "t7",
      title: "Suez Canal transit",
      location: "Suez, EG",
      timestamp: "Est. Jun 13, 2026",
      status: "upcoming",
    },
    {
      id: "t8",
      title: "Arrival & discharge",
      location: "Rotterdam, NL",
      timestamp: "Est. Jun 19, 2026",
      status: "upcoming",
    },
    {
      id: "t9",
      title: "Door delivery",
      location: "Duisburg, DE",
      timestamp: "Est. Jun 21, 2026",
      status: "upcoming",
    },
  ],
  sensors: [
    { label: "Temperature", value: "4.2°C", status: "ok", hint: "Setpoint 4.0°C ±2°" },
    { label: "Humidity", value: "61%", status: "ok", hint: "Within range" },
    { label: "Shock", value: "0.3 g", status: "ok", hint: "No impact events" },
    { label: "Door", value: "Sealed", status: "ok", hint: "Last opened at origin" },
    { label: "Power", value: "On", status: "ok", hint: "Reefer plug active" },
    { label: "GPS ping", value: "2 min ago", status: "ok", hint: "Live telemetry" },
  ],
  documents: [
    { name: "Bill of Lading", type: "PDF", size: "240 KB" },
    { name: "Commercial Invoice", type: "PDF", size: "118 KB" },
    { name: "Packing List", type: "PDF", size: "96 KB" },
    { name: "Dangerous Goods Declaration", type: "PDF", size: "152 KB" },
    { name: "Certificate of Origin", type: "PDF", size: "88 KB" },
  ],
  alerts: [
    {
      id: "a1",
      severity: "resolved",
      title: "Red Sea congestion avoided",
      body: "Predictive model flagged a 3.5-day delay risk. Route auto-adjusted; schedule preserved.",
      time: "2 days ago",
    },
    {
      id: "a2",
      severity: "info",
      title: "Customs pre-clearance started",
      body: "Rotterdam import filing submitted early based on predicted arrival window.",
      time: "6 hours ago",
    },
  ],
};
