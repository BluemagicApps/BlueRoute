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
  labelKey: string;
  href: string;
  descriptionKey: string;
  icon: LucideIcon;
};

export type MegaGroup = {
  headingKey: string;
  items: MegaItem[];
};

export type NavLink = {
  labelKey: string;
  href: string;
  mega?: MegaGroup[];
  featured?: { titleKey: string; blurbKey: string; href: string };
};

export const NAV: NavLink[] = [
  {
    labelKey: "Nav.services.label",
    href: "/services",
    mega: [
      {
        headingKey: "Nav.services.groups.freightModes.heading",
        items: [
          {
            labelKey: "Nav.services.groups.freightModes.oceanFreight.label",
            href: "/services/ocean-freight",
            descriptionKey: "Nav.services.groups.freightModes.oceanFreight.description",
            icon: Ship,
          },
          {
            labelKey: "Nav.services.groups.freightModes.airFreight.label",
            href: "/services/air-freight",
            descriptionKey: "Nav.services.groups.freightModes.airFreight.description",
            icon: Plane,
          },
          {
            labelKey: "Nav.services.groups.freightModes.landFreight.label",
            href: "/services/land-freight",
            descriptionKey: "Nav.services.groups.freightModes.landFreight.description",
            icon: Truck,
          },
          {
            labelKey: "Nav.services.groups.freightModes.doorToDoor.label",
            href: "/services/door-to-door",
            descriptionKey: "Nav.services.groups.freightModes.doorToDoor.description",
            icon: Route,
          },
        ],
      },
      {
        headingKey: "Nav.services.groups.specialized.heading",
        items: [
          {
            labelKey: "Nav.services.groups.specialized.projectCargo.label",
            href: "/services/project-cargo",
            descriptionKey: "Nav.services.groups.specialized.projectCargo.description",
            icon: Boxes,
          },
          {
            labelKey: "Nav.services.groups.specialized.coldChain.label",
            href: "/services/cold-chain",
            descriptionKey: "Nav.services.groups.specialized.coldChain.description",
            icon: Snowflake,
          },
          {
            labelKey: "Nav.services.groups.specialized.customs.label",
            href: "/services/customs",
            descriptionKey: "Nav.services.groups.specialized.customs.description",
            icon: FileCheck2,
          },
          {
            labelKey: "Nav.services.groups.specialized.warehouseLeasing.label",
            href: "/warehousing",
            descriptionKey: "Nav.services.groups.specialized.warehouseLeasing.description",
            icon: Warehouse,
          },
        ],
      },
    ],
    featured: {
      titleKey: "Nav.services.featuredTitle",
      blurbKey: "Nav.services.featuredBlurb",
      href: "/ai-edge",
    },
  },
  {
    labelKey: "Nav.aiEdge.label",
    href: "/ai-edge",
    mega: [
      {
        headingKey: "Nav.aiEdge.groups.intelligence.heading",
        items: [
          {
            labelKey: "Nav.aiEdge.groups.intelligence.assistant.label",
            href: "/ai-edge#assistant",
            descriptionKey: "Nav.aiEdge.groups.intelligence.assistant.description",
            icon: Bot,
          },
          {
            labelKey: "Nav.aiEdge.groups.intelligence.predictiveInsights.label",
            href: "/ai-edge#predictive",
            descriptionKey: "Nav.aiEdge.groups.intelligence.predictiveInsights.description",
            icon: LineChart,
          },
          {
            labelKey: "Nav.aiEdge.groups.intelligence.routeOptimizer.label",
            href: "/ai-edge#optimizer",
            descriptionKey: "Nav.aiEdge.groups.intelligence.routeOptimizer.description",
            icon: Route,
          },
          {
            labelKey: "Nav.aiEdge.groups.intelligence.exceptionRadar.label",
            href: "/tracking",
            descriptionKey: "Nav.aiEdge.groups.intelligence.exceptionRadar.description",
            icon: Radar,
          },
        ],
      },
    ],
  },
  { labelKey: "Nav.tracking.label", href: "/tracking" },
  { labelKey: "Nav.warehousing.label", href: "/warehousing" },
  {
    labelKey: "Nav.company.label",
    href: "/about",
    mega: [
      {
        headingKey: "Nav.company.groups.company.heading",
        items: [
          {
            labelKey: "Nav.company.groups.company.about.label",
            href: "/about",
            descriptionKey: "Nav.company.groups.company.about.description",
            icon: Building2,
          },
          {
            labelKey: "Nav.company.groups.company.insights.label",
            href: "/insights",
            descriptionKey: "Nav.company.groups.company.insights.description",
            icon: Newspaper,
          },
          {
            labelKey: "Nav.company.groups.company.sustainability.label",
            href: "/sustainability",
            descriptionKey: "Nav.company.groups.company.sustainability.description",
            icon: Leaf,
          },
          {
            labelKey: "Nav.company.groups.company.careers.label",
            href: "/careers",
            descriptionKey: "Nav.company.groups.company.careers.description",
            icon: Briefcase,
          },
        ],
      },
    ],
  },
];

export const FOOTER_COLUMNS: { headingKey: string; links: { labelKey: string; href: string }[] }[] =
  [
    {
      headingKey: "Footer.columns.services.heading",
      links: [
        { labelKey: "Footer.columns.services.oceanFreight", href: "/services/ocean-freight" },
        { labelKey: "Footer.columns.services.airFreight", href: "/services/air-freight" },
        { labelKey: "Footer.columns.services.landFreight", href: "/services/land-freight" },
        { labelKey: "Footer.columns.services.doorToDoor", href: "/services/door-to-door" },
        { labelKey: "Footer.columns.services.coldChain", href: "/services/cold-chain" },
        { labelKey: "Footer.columns.services.customs", href: "/services/customs" },
        { labelKey: "Footer.columns.services.projectCargo", href: "/services/project-cargo" },
      ],
    },
    {
      headingKey: "Footer.columns.platform.heading",
      links: [
        { labelKey: "Footer.columns.platform.liveTracking", href: "/tracking" },
        { labelKey: "Footer.columns.platform.getQuote", href: "/quote" },
        { labelKey: "Footer.columns.platform.warehouseLeasing", href: "/warehousing" },
        { labelKey: "Footer.columns.platform.aiEdge", href: "/ai-edge" },
        { labelKey: "Footer.columns.platform.customerPortal", href: "/portal" },
      ],
    },
    {
      headingKey: "Footer.columns.company.heading",
      links: [
        { labelKey: "Footer.columns.company.about", href: "/about" },
        { labelKey: "Footer.columns.company.insights", href: "/insights" },
        { labelKey: "Footer.columns.company.sustainability", href: "/sustainability" },
        { labelKey: "Footer.columns.company.careers", href: "/careers" },
        { labelKey: "Footer.columns.company.contact", href: "/contact" },
      ],
    },
  ];
