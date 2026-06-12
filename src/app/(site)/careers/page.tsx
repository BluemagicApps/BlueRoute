import type { Metadata } from "next";
import {
  Briefcase,
  Rocket,
  Globe2,
  HeartHandshake,
  GraduationCap,
  Leaf,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { RolesList } from "@/components/careers/roles-list";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Build the future of logistics at Blue Route — open roles across engineering, AI, operations, and commercial, with remote-friendly culture and real impact.",
};

const PERKS = [
  { icon: Globe2, color: "cyan", title: "Remote-friendly", body: "Work from anywhere across our hubs, with regular team gatherings." },
  { icon: Rocket, color: "indigo", title: "Real ownership", body: "Small teams, big mandates — ship things that move global trade." },
  { icon: GraduationCap, color: "teal", title: "Learning budget", body: "Annual stipend for courses, conferences, and certifications." },
  { icon: HeartHandshake, color: "amber", title: "Great benefits", body: "Competitive pay, equity, health, and generous time off." },
  { icon: Leaf, color: "emerald", title: "Purpose", body: "Help decarbonize one of the world's hardest-to-abate sectors." },
  { icon: Sparkles, color: "indigo", title: "Frontier tech", body: "Work on agentic AI, predictive systems, and real-time logistics." },
];

const CHIP: Record<string, string> = {
  cyan: "bg-cyan/10 text-cyan",
  indigo: "bg-indigo/10 text-indigo",
  teal: "bg-teal/10 text-teal",
  amber: "bg-amber/10 text-amber",
  emerald: "bg-emerald/10 text-emerald",
};

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-14 lg:pt-40">
        <div className="bg-grid absolute inset-0 -z-10 h-96" />
        <div className="absolute -left-28 top-12 -z-10 h-[28rem] w-[28rem] rounded-full bg-cyan/20 blur-[120px] animate-aurora" />
        <div className="absolute -right-24 top-24 -z-10 h-[26rem] w-[26rem] rounded-full bg-indigo/20 blur-[130px] animate-aurora" />

        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <Briefcase className="h-3.5 w-3.5" /> Careers
          </span>
          <h1
            className="mt-6 text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-foam md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Build the future of <span className="text-gradient">logistics.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-mist">
            We&apos;re a team of engineers, operators, and optimists making global
            shipping intelligent. Come help us ship it.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="relative py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="Why join" title="Work that matters, on a team that cares" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PERKS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 0.05}>
                  <article className="h-full rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40">
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl ${CHIP[p.color]}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3
                      className="mt-5 text-lg font-semibold text-foam"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-mist">{p.body}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="relative py-12 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="Open roles" title="Find your seat" />
          <div className="mt-10">
            <RolesList />
          </div>
          <p className="mt-8 text-center text-sm text-mist">
            Don&apos;t see your role?{" "}
            <a href="/contact" className="font-semibold text-cyan">
              Tell us how you&apos;d contribute →
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
