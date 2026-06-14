// src/lib/about-data.ts

export type Stat = { v: string; l: string };
export type TimelineEntry = { year: string; title: string; body: string };
export type Leader = { name: string; role: string; photo: string; bio: string };

export const STATS: Stat[] = [
  { v: "180+", l: "Countries served" },
  { v: "2.4M", l: "Containers / year" },
  { v: "9", l: "Smart warehouse hubs" },
  { v: "94%", l: "On-time, AI-verified" },
];

export const TIMELINE: TimelineEntry[] = [
  { year: "1998", title: "Founded in Houston", body: "One van, one promise — door-to-door parcel delivery across the city." },
  { year: "2004", title: "Gulf-Coast freight", body: "Grew into regional LTL and full-truckload trucking across Texas and the Gulf Coast." },
  { year: "2011", title: "Going global", body: "Opened our first international ocean lanes and brought customs brokerage in-house." },
  { year: "2017", title: "Door-to-door network", body: "Full origin-to-destination coverage, with offices in LA, Rotterdam, and Singapore." },
  { year: "2023", title: "The AI Edge", body: "Predictive ETAs and agentic planning go live for every customer." },
  { year: "2026", title: "180+ countries", body: "Now moving 2.4M containers a year on the world's smartest network." },
];

export const LEADERS: Leader[] = [
  {
    name: "Carol Briggs",
    role: "Founder & CEO",
    photo: "/leadership/23.jpg",
    bio: "Carol started Blue Route in 1998 with a single van, running parcels across Houston on one promise: every package arrives exactly as expected. Nearly three decades later she still runs the company by that standard — now across 180+ countries. She has spent her career proving that reliability is a product, not a slogan, and she's steering Blue Route toward a future where no shipper is ever surprised by their own supply chain.",
  },
  {
    name: "Michael Reyes",
    role: "Co-founder & CTO",
    photo: "/leadership/20.jpg",
    bio: "Michael joined Carol in the early Houston days and turned a shoebox of tracking spreadsheets into the platform that powers Blue Route today. He architected the systems behind real-time visibility and the AI Edge, and he's the reason a company that began as a courier can out-engineer carriers a hundred times its size. His focus now: a network that predicts and self-corrects before a human ever has to.",
  },
  {
    name: "Rachel Donovan",
    role: "Chief Operations Officer",
    photo: "/leadership/24.jpg",
    bio: "Rachel runs the machine — the global door-to-door network, the nine smart-warehouse hubs, and the thousands of moves that happen every day. She came up through port operations and freight forwarding, and she's known for turning chaos into choreography. Under her, Blue Route's on-time rate climbed to 94%, AI-verified, and she's pushing it higher.",
  },
  {
    name: "Arjun Mehta",
    role: "Head of AI",
    photo: "/leadership/21.jpg",
    bio: "Arjun leads the team behind Blue Route's predictive ETAs, route optimization, and agentic resolution. He came from applied machine learning to answer one question: what if logistics could think a step ahead? His models now weigh weather, ports, and live demand on every shipment — and he's building toward a network that plans itself.",
  },
];
