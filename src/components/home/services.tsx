import Link from "next/link";
import {
  Ship,
  Plane,
  Truck,
  Route,
  Warehouse,
  Snowflake,
  FileCheck2,
  Boxes,
  ArrowUpRight,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

// Distinct icon-chip hue per card (static classes for Tailwind).
const CHIPS = [
  "bg-cyan/10 text-cyan group-hover:bg-cyan group-hover:text-white",
  "bg-indigo/10 text-indigo group-hover:bg-indigo group-hover:text-white",
  "bg-teal/10 text-teal group-hover:bg-teal group-hover:text-white",
  "bg-emerald/10 text-emerald group-hover:bg-emerald group-hover:text-white",
  "bg-amber/10 text-amber group-hover:bg-amber group-hover:text-white",
  "bg-rose/10 text-rose group-hover:bg-rose group-hover:text-white",
];

const SERVICES = [
  {
    icon: Ship,
    key: "oceanFreight",
    href: "/services/ocean-freight",
  },
  {
    icon: Plane,
    key: "airFreight",
    href: "/services/air-freight",
  },
  {
    icon: Truck,
    key: "landFreight",
    href: "/services/land-freight",
  },
  {
    icon: Route,
    key: "doorToDoor",
    href: "/services/door-to-door",
  },
  {
    icon: Warehouse,
    key: "warehouseLeasing",
    href: "/warehousing",
  },
  {
    icon: Snowflake,
    key: "coldChain",
    href: "/services/cold-chain",
  },
  {
    icon: FileCheck2,
    key: "customs",
    href: "/services/customs",
  },
  {
    icon: Boxes,
    key: "projectCargo",
    href: "/services/project-cargo",
  },
] as const;

export async function Services() {
  const t = await getTranslations("Home.services");

  return (
    <section className="relative py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.key} delay={i * 0.06}>
                <Link
                  href={s.href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-steel/70 bg-deep p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl transition-colors ${CHIPS[i % CHIPS.length]}`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-mist transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan" />
                  </div>
                  <h3
                    className="mt-5 text-lg font-semibold text-foam"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t(`items.${s.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{t(`items.${s.key}.body`)}</p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
