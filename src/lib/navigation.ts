import type { LucideIcon } from "lucide-react";
import {
  Ship,
  Plane,
  Truck,
  Warehouse,
  Snowflake,
  FileCheck2,
  Boxes,
  Radar,
  Route,
  Bot,
  LineChart,
  Newspaper,
  Building2,
  Leaf,
  Briefcase,
} from "lucide-react";

export type MegaItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export type MegaGroup = {
  heading: string;
  items: MegaItem[];
};

export type NavLink = {
  label: string;
  href: string;
  mega?: MegaGroup[];
  featured?: { title: string; blurb: string; href: string };
};

export const NAV: NavLink[] = [
  {
    label: "Services",
    href: "/services",
    mega: [
      {
        heading: "Freight modes",
        items: [
          {
            label: "Ocean Freight (FCL/LCL)",
            href: "/services/ocean-freight",
            description: "Full & less-than-container loads on every major lane.",
            icon: Ship,
          },
          {
            label: "Air Freight",
            href: "/services/air-freight",
            description: "Time-critical airfreight with guaranteed lift.",
            icon: Plane,
          },
          {
            label: "Land Freight (Road & Rail)",
            href: "/services/land-freight",
            description: "Road, rail & drayage with live, connected handoffs.",
            icon: Truck,
          },
          {
            label: "Door-to-Door",
            href: "/services/door-to-door",
            description: "One contract, origin pickup to final delivery.",
            icon: Route,
          },
        ],
      },
      {
        heading: "Specialized",
        items: [
          {
            label: "Project & Heavy Cargo",
            href: "/services/project-cargo",
            description: "Oversized, breakbulk & out-of-gauge engineering.",
            icon: Boxes,
          },
          {
            label: "Cold Chain",
            href: "/services/cold-chain",
            description: "Temperature-controlled, IoT-monitored end to end.",
            icon: Snowflake,
          },
          {
            label: "Customs & Compliance",
            href: "/services/customs",
            description: "Automated clearance with predictive duty checks.",
            icon: FileCheck2,
          },
          {
            label: "Warehouse Leasing",
            href: "/warehousing",
            description: "Smart facilities, searchable map, AI matching.",
            icon: Warehouse,
          },
        ],
      },
    ],
    featured: {
      title: "The AI Edge",
      blurb: "See how predictive intelligence beats reactive logistics.",
      href: "/ai-edge",
    },
  },
  {
    label: "AI Edge",
    href: "/ai-edge",
    mega: [
      {
        heading: "Intelligence",
        items: [
          {
            label: "BlueRoute AI Assistant",
            href: "/ai-edge#assistant",
            description: "Agentic chat & voice for quotes, risk & planning.",
            icon: Bot,
          },
          {
            label: "Predictive Insights",
            href: "/ai-edge#predictive",
            description: "Delay probabilities, alternates & cost forecasts.",
            icon: LineChart,
          },
          {
            label: "Route Optimizer",
            href: "/ai-edge#optimizer",
            description: "Lowest-risk, lowest-carbon routing in seconds.",
            icon: Route,
          },
          {
            label: "Exception Radar",
            href: "/tracking",
            description: "Proactive issue resolution before it costs you.",
            icon: Radar,
          },
        ],
      },
    ],
  },
  { label: "Tracking", href: "/tracking" },
  { label: "Warehousing", href: "/warehousing" },
  {
    label: "Company",
    href: "/about",
    mega: [
      {
        heading: "Company",
        items: [
          {
            label: "About Blue Route",
            href: "/about",
            description: "Our mission to make shipping intelligent.",
            icon: Building2,
          },
          {
            label: "Insights & Blog",
            href: "/insights",
            description: "Market intelligence and logistics trends.",
            icon: Newspaper,
          },
          {
            label: "Sustainability",
            href: "/sustainability",
            description: "Decarbonizing global trade, route by route.",
            icon: Leaf,
          },
          {
            label: "Careers",
            href: "/careers",
            description: "Build the future of logistics with us.",
            icon: Briefcase,
          },
        ],
      },
    ],
  },
];

export const FOOTER_COLUMNS: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: "Services",
      links: [
        { label: "Ocean Freight", href: "/services/ocean-freight" },
        { label: "Air Freight", href: "/services/air-freight" },
        { label: "Land Freight", href: "/services/land-freight" },
        { label: "Door-to-Door", href: "/services/door-to-door" },
        { label: "Cold Chain", href: "/services/cold-chain" },
        { label: "Customs & Compliance", href: "/services/customs" },
        { label: "Project Cargo", href: "/services/project-cargo" },
      ],
    },
    {
      heading: "Platform",
      links: [
        { label: "Live Tracking", href: "/tracking" },
        { label: "Get a Quote", href: "/quote" },
        { label: "Warehouse Leasing", href: "/warehousing" },
        { label: "AI Edge", href: "/ai-edge" },
        { label: "Customer Portal", href: "/portal" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Insights", href: "/insights" },
        { label: "Sustainability", href: "/sustainability" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];
