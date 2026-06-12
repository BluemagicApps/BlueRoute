import type { LucideIcon } from "lucide-react";
import {
  Ship,
  Plane,
  Train,
  Route,
  Truck,
  Boxes,
  Snowflake,
  FileCheck2,
  Gauge,
  ShieldCheck,
  Globe2,
  Clock,
  Leaf,
  Radar,
  PackageCheck,
  Thermometer,
  Container,
  MapPinned,
  Zap,
} from "lucide-react";

export type ServiceColor = "cyan" | "aqua" | "indigo" | "teal" | "amber" | "emerald";

/** Optional ambient line-art vehicle drawn behind the service hero. */
export type HeroVehicle = "ship" | "plane" | "train" | "truck";

export type Service = {
  slug: string;
  title: string;
  short: string; // for hub cards & nav
  tagline: string;
  icon: LucideIcon;
  color: ServiceColor;
  heroVehicle?: HeroVehicle;
  /** Scene photo (in /public/scenes) for services without a heroVehicle. */
  heroScene?: string;
  intro: string;
  highlights: string[];
  features: { icon: LucideIcon; title: string; body: string }[];
  steps: { title: string; body: string }[];
  aiAngle: string;
  stats: { v: string; l: string }[];
};

export const SERVICES: Service[] = [
  {
    slug: "ocean-freight",
    title: "Ocean Freight (FCL & LCL)",
    short: "Ocean Freight",
    tagline: "Reliable full- and less-than-container loads on every major lane.",
    icon: Ship,
    color: "cyan",
    heroVehicle: "ship",
    intro:
      "Move full containers (FCL) or consolidate smaller shipments (LCL) across the world's busiest trade lanes — with guaranteed space, predictive ETAs, and live visibility from gate-in to discharge.",
    highlights: [
      "Guaranteed allocation on priority lanes",
      "FCL, LCL & consolidation options",
      "Predictive ETA with confidence scoring",
      "Live exception alerts & auto re-routing",
    ],
    features: [
      { icon: Globe2, title: "Global lane coverage", body: "Direct and transshipment services across Asia, Europe, the Americas, and beyond." },
      { icon: Gauge, title: "Predictive ETAs", body: "AI forecasts arrival with a live confidence score, updated as conditions change." },
      { icon: Container, title: "Flexible equipment", body: "Standard, high-cube, reefer, and special equipment matched to your cargo." },
    ],
    steps: [
      { title: "Quote & book", body: "Get AI-optimized rates and routes in seconds, then book online." },
      { title: "Origin handling", body: "Pickup, gate-in, and loading with live milestone tracking." },
      { title: "In transit", body: "Real-time position, predictive ETA, and proactive risk management." },
      { title: "Arrival & delivery", body: "Discharge, customs, and final delivery — all in one view." },
    ],
    aiAngle:
      "The route optimizer continuously balances cost, transit time, and emissions — and keeps a congestion-avoiding backup lane ready in case your primary route slows.",
    stats: [
      { v: "94%", l: "On-time, AI-verified" },
      { v: "180+", l: "Countries served" },
      { v: "60s", l: "To an optimized quote" },
    ],
  },
  {
    slug: "air-freight",
    title: "Air Freight",
    short: "Air Freight",
    tagline: "Time-critical airfreight with guaranteed lift and live flight tracking.",
    icon: Plane,
    color: "aqua",
    heroVehicle: "plane",
    intro:
      "When speed wins, move it by air. From next-flight-out express to consolidated economy and full charters, we secure capacity, handle security screening, and track your shipment flight-by-flight from tender to final delivery.",
    highlights: [
      "Express, deferred & charter options",
      "Guaranteed capacity on key lanes",
      "Temperature & pharma-grade handling",
      "Live flight tracking with predictive ETAs",
    ],
    features: [
      { icon: Zap, title: "Speed when it counts", body: "Next-flight-out and express services for shipments that can't wait." },
      { icon: ShieldCheck, title: "Screening handled", body: "Known-shipper compliance, security screening, and dangerous-goods expertise." },
      { icon: Thermometer, title: "Sensitive cargo", body: "Temperature-controlled and pharma-grade handling for high-value goods." },
    ],
    steps: [
      { title: "Book & screen", body: "Get instant air rates, then we handle security screening and documentation." },
      { title: "Origin handling", body: "Pickup, build-up, and tender to the airline with live milestones." },
      { title: "In flight", body: "Flight-by-flight tracking with a predictive arrival as connections update." },
      { title: "Customs & delivery", body: "Pre-cleared on arrival and delivered to the door, tracked to completion." },
    ],
    aiAngle:
      "The AI watches live flight schedules and capacity — and when a connection slips, it re-books the next viable routing automatically before your delivery window is at risk.",
    stats: [
      { v: "<48h", l: "Express door-to-door" },
      { v: "500+", l: "Airport pairs served" },
      { v: "99%", l: "Flight-status accuracy" },
    ],
  },
  {
    slug: "door-to-door",
    title: "Door-to-Door",
    short: "Door-to-Door",
    tagline: "One accountable contract from origin pickup to final-mile delivery.",
    icon: Route,
    color: "indigo",
    heroScene: "/scenes/door-to-door.jpg",
    intro:
      "Hand us the whole journey. We manage pickup, export, ocean, import, and last-mile delivery under a single contract and a single point of accountability — with one timeline you can actually trust.",
    highlights: [
      "Single contract, single owner",
      "End-to-end milestone visibility",
      "Integrated customs & inland",
      "One predictive ETA for the whole journey",
    ],
    features: [
      { icon: MapPinned, title: "True end-to-end", body: "Origin pickup to destination doorstep, orchestrated as one move." },
      { icon: ShieldCheck, title: "One accountability", body: "No finger-pointing between vendors — we own the outcome." },
      { icon: Radar, title: "Whole-journey ETA", body: "A single predictive arrival across every leg and handoff." },
    ],
    steps: [
      { title: "Pickup", body: "Collection at origin with documentation handled for you." },
      { title: "Export & ocean", body: "Customs clearance and the optimized ocean leg." },
      { title: "Import", body: "Destination clearance pre-filed against the predicted arrival." },
      { title: "Final mile", body: "Inland delivery to the door, tracked to completion." },
    ],
    aiAngle:
      "Because the AI sees every leg at once, it pre-clears customs against the predicted arrival window and re-sequences inland delivery automatically when the ocean leg shifts.",
    stats: [
      { v: "1", l: "Contract & owner" },
      { v: "5", l: "Legs orchestrated" },
      { v: "99%", l: "ETA confidence" },
    ],
  },
  {
    slug: "land-freight",
    title: "Land Freight (Road & Rail)",
    short: "Land Freight",
    tagline: "Road, rail, and drayage line-haul with live, connected handoffs.",
    icon: Truck,
    color: "teal",
    heroVehicle: "truck",
    intro:
      "Move cargo overland with intelligent road and rail. From full and less-than truckload to intermodal rail and cross-border line-haul — plus port drayage and container return — we blend modes to optimize cost and carbon, with every handoff tracked so nothing falls through the cracks.",
    highlights: [
      "FTL & LTL trucking",
      "Intermodal rail & cross-border line-haul",
      "Port drayage & container return managed",
      "Lower-carbon, rail-first options",
    ],
    features: [
      { icon: Truck, title: "Road, your way", body: "Full-truckload, less-than-truckload, and expedited road across regions." },
      { icon: Train, title: "Intermodal rail", body: "Rail line-haul slotted in wherever it cuts cost and emissions without losing time." },
      { icon: Clock, title: "Connected handoffs", body: "Every transfer — port, rail yard, or dock — is tracked and time-stamped." },
    ],
    steps: [
      { title: "Pickup / drayage", body: "Collection or terminal drayage with appointment optimization." },
      { title: "Line-haul", body: "Road or intermodal rail on the optimized overland leg." },
      { title: "Delivery", body: "Final-mile to your facility, tracked to the dock." },
      { title: "Container return", body: "Empty return and demurrage avoidance handled for you." },
    ],
    aiAngle:
      "AI sequences pickup and rail appointments to dodge port congestion and minimize demurrage and detention — often the most expensive surprises in a shipment — and recommends rail over road wherever it cuts carbon without missing the window.",
    stats: [
      { v: "2", l: "Modes blended: road + rail" },
      { v: "−18%", l: "Avg. overland emissions" },
      { v: "0", l: "Blind handoffs" },
    ],
  },
  {
    slug: "project-cargo",
    title: "Project & Heavy Cargo",
    short: "Project Cargo",
    tagline: "Engineered handling for oversized, breakbulk, and out-of-gauge loads.",
    icon: Boxes,
    color: "amber",
    heroScene: "/scenes/project-cargo.jpg",
    intro:
      "When cargo won't fit a box, our project team engineers the move — from route surveys and lifting plans to permits and specialized equipment for oversized, heavy, and breakbulk shipments.",
    highlights: [
      "Route surveys & feasibility",
      "Lifting & lashing plans",
      "Permits & escorts managed",
      "Breakbulk & out-of-gauge expertise",
    ],
    features: [
      { icon: PackageCheck, title: "Engineered moves", body: "Dedicated engineers plan every lift, route, and securing detail." },
      { icon: ShieldCheck, title: "Risk-managed", body: "Surveys, insurance, and contingency planning for high-value cargo." },
      { icon: Globe2, title: "Specialized equipment", body: "Flat racks, open-top, MAFI, and heavy-lift vessel partners." },
    ],
    steps: [
      { title: "Feasibility", body: "Route survey, equipment selection, and a costed plan." },
      { title: "Engineering", body: "Lifting, lashing, and securing plans signed off." },
      { title: "Execution", body: "Permits, escorts, and the move itself, supervised." },
      { title: "Delivery", body: "Placement at site with on-the-ground coordination." },
    ],
    aiAngle:
      "AI models weather windows and route risk for heavy-lift moves, flagging the safest sailing and transit slots before they're booked.",
    stats: [
      { v: "100%", l: "Engineered & surveyed" },
      { v: "24/7", l: "Move supervision" },
      { v: "0", l: "Compromises on safety" },
    ],
  },
  {
    slug: "cold-chain",
    title: "Cold Chain",
    short: "Cold Chain",
    tagline: "Temperature-controlled, IoT-monitored integrity from dock to door.",
    icon: Snowflake,
    color: "teal",
    heroScene: "/scenes/cold-chain.jpg",
    intro:
      "Protect temperature-sensitive cargo end to end. Reefer equipment, IoT monitoring, and instant alerts keep pharma, food, and perishables in spec across the entire journey.",
    highlights: [
      "Reefer & controlled-atmosphere equipment",
      "Live temperature & humidity telemetry",
      "Instant out-of-range alerts",
      "Compliant pharma & food handling",
    ],
    features: [
      { icon: Thermometer, title: "Live telemetry", body: "Temperature, humidity, and door sensors stream continuously." },
      { icon: Radar, title: "Instant alerts", body: "Any drift outside setpoint triggers an immediate, actionable alert." },
      { icon: ShieldCheck, title: "Compliance-ready", body: "GDP-aligned handling and full audit trails for sensitive cargo." },
    ],
    steps: [
      { title: "Pre-cool & load", body: "Equipment pre-cooled to setpoint before loading." },
      { title: "Monitored transit", body: "Continuous IoT telemetry with live exception watch." },
      { title: "Excursion response", body: "Out-of-range events resolved before product is at risk." },
      { title: "Delivery & audit", body: "In-spec delivery with a complete temperature record." },
    ],
    aiAngle:
      "AI learns each lane's thermal risk and pre-empts excursions — pre-cooling harder before a hot port call or flagging a reefer that's trending out of range.",
    stats: [
      { v: "±0.5°C", l: "Setpoint accuracy" },
      { v: "24/7", l: "IoT monitoring" },
      { v: "100%", l: "Audit trail" },
    ],
  },
  {
    slug: "customs",
    title: "Customs & Compliance",
    short: "Customs & Compliance",
    tagline: "Automated clearance with predictive duty and documentation checks.",
    icon: FileCheck2,
    color: "emerald",
    heroScene: "/scenes/customs.jpg",
    intro:
      "Clear borders faster. We automate documentation, classify goods, and pre-file against predicted arrival — catching duty and compliance issues before they cause costly holds.",
    highlights: [
      "Automated documentation",
      "HS classification & duty estimation",
      "Pre-clearance against predicted arrival",
      "Bonded & special-regime handling",
    ],
    features: [
      { icon: FileCheck2, title: "Automated filing", body: "Documents validated and submitted with fewer manual touches." },
      { icon: Gauge, title: "Predictive duty checks", body: "Estimate duties and flag classification risks up front." },
      { icon: ShieldCheck, title: "Compliance assured", body: "Bonded zones, special regimes, and audit-ready records." },
    ],
    steps: [
      { title: "Document capture", body: "Commercial docs ingested and validated automatically." },
      { title: "Classification", body: "HS codes and duties checked, exceptions flagged early." },
      { title: "Pre-clearance", body: "Filed against the predicted arrival to avoid holds." },
      { title: "Release", body: "Cleared and released, with a full compliance trail." },
    ],
    aiAngle:
      "AI submits import filings early based on the predictive ETA, so clearance is often complete before the vessel berths — turning customs from a bottleneck into a non-event.",
    stats: [
      { v: "−40%", l: "Avg. clearance time" },
      { v: "100%", l: "Audit-ready" },
      { v: "0", l: "Surprise holds, goal" },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
