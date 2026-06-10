/** Mock data for the customer portal dashboard. */

export const PORTAL_USER = {
  name: "Jane Okafor",
  company: "Acme Trading Co.",
  initials: "JO",
};

export const KPIS = [
  { label: "Active shipments", value: "12", delta: "+3 this week", color: "cyan" },
  { label: "On-time rate", value: "96%", delta: "+2.1% vs Q1", color: "emerald" },
  { label: "Spend (MTD)", value: "$284k", delta: "−6% vs forecast", color: "indigo" },
  { label: "CO₂ saved (YTD)", value: "41 t", delta: "Green Route", color: "teal" },
] as const;

export type Shipment = {
  ref: string;
  lane: string;
  mode: string;
  status: "In transit" | "At port" | "Customs" | "Delivered" | "Booked";
  eta: string;
  confidence: number;
  progress: number;
};

export const SHIPMENTS: Shipment[] = [
  { ref: "BR-7741-2026", lane: "Shanghai → Rotterdam", mode: "FCL · 40'HC", status: "In transit", eta: "Jun 19", confidence: 99, progress: 62 },
  { ref: "BR-7720-2026", lane: "Singapore → Los Angeles", mode: "FCL · 40'", status: "At port", eta: "Jun 12", confidence: 97, progress: 88 },
  { ref: "BR-7705-2026", lane: "Shenzhen → Hamburg", mode: "LCL · 18 m³", status: "Customs", eta: "Jun 10", confidence: 95, progress: 93 },
  { ref: "BR-7698-2026", lane: "Dubai → New York", mode: "FCL · 40'RF", status: "In transit", eta: "Jun 24", confidence: 92, progress: 34 },
  { ref: "BR-7651-2026", lane: "Mumbai → Antwerp", mode: "FCL · 20'", status: "Delivered", eta: "Jun 02", confidence: 100, progress: 100 },
  { ref: "BR-7777-2026", lane: "Busan → Sydney", mode: "FCL · 40'HC", status: "Booked", eta: "Jul 01", confidence: 90, progress: 8 },
];

export type Invoice = {
  id: string;
  date: string;
  amount: string;
  status: "Paid" | "Due" | "Overdue";
};

export const INVOICES: Invoice[] = [
  { id: "INV-20451", date: "Jun 01, 2026", amount: "$48,200", status: "Due" },
  { id: "INV-20388", date: "May 18, 2026", amount: "$31,750", status: "Paid" },
  { id: "INV-20322", date: "May 04, 2026", amount: "$52,900", status: "Paid" },
  { id: "INV-20290", date: "Apr 21, 2026", amount: "$19,400", status: "Overdue" },
  { id: "INV-20255", date: "Apr 07, 2026", amount: "$44,100", status: "Paid" },
];

// Monthly spend ($k) for the analytics chart.
export const SPEND = [
  { m: "Jan", v: 210 },
  { m: "Feb", v: 248 },
  { m: "Mar", v: 232 },
  { m: "Apr", v: 268 },
  { m: "May", v: 254 },
  { m: "Jun", v: 284 },
];

export const INVENTORY = [
  { hub: "Rotterdam Smart Hub A", usedPct: 78, used: "65,500", total: "84,000" },
  { hub: "Singapore Logistics Park", usedPct: 54, used: "52,900", total: "98,000" },
  { hub: "Dubai Logistics City", usedPct: 41, used: "65,600", total: "160,000" },
];

export const AI_INSIGHTS = [
  "Shipment BR-7698 has a 12% delay risk near the Strait of Hormuz — a reroute is staged and ready.",
  "Consolidating your two Shenzhen→EU LCL bookings could save an est. $4,300.",
  "Rotterdam Smart Hub A hits 90% utilization in ~3 weeks at current inbound volume.",
];
