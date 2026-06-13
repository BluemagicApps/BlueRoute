import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { SERVICES, getService, type ServiceColor } from "@/lib/services-data";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { TransportPhoto } from "@/components/ui/transport-photo";

const CHIP: Record<ServiceColor, string> = {
  cyan: "bg-cyan/10 text-cyan",
  aqua: "bg-aqua/10 text-aqua",
  indigo: "bg-indigo/10 text-indigo",
  teal: "bg-teal/10 text-teal",
  amber: "bg-amber/10 text-amber",
  emerald: "bg-emerald/10 text-emerald",
};
const GLOW: Record<ServiceColor, string> = {
  cyan: "bg-cyan/25",
  aqua: "bg-aqua/25",
  indigo: "bg-indigo/25",
  teal: "bg-teal/25",
  amber: "bg-amber/25",
  emerald: "bg-emerald/25",
};

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return { title: "Service" };
  return { title: s.title, description: s.tagline };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) notFound();

  const Icon = s.icon;
  const related = SERVICES.filter((x) => x.slug !== s.slug).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-12 lg:pt-40">
        {s.heroVehicle ? (
          <TransportPhoto vehicle={s.heroVehicle} />
        ) : s.heroScene ? (
          <TransportPhoto src={s.heroScene} />
        ) : (
          <>
            <div className="bg-grid absolute inset-0 -z-10 h-96" />
            <div className={`absolute -left-28 top-12 -z-10 h-[28rem] w-[28rem] rounded-full blur-[120px] animate-aurora ${GLOW[s.color]}`} />
          </>
        )}

        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <nav className="mb-6 flex items-center gap-2 text-sm text-mist">
            <Link href="/services" className="hover:text-foam">
              Services
            </Link>
            <span>/</span>
            <span className="text-foam">{s.short}</span>
          </nav>

          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${CHIP[s.color]}`}>
                <Icon className="h-7 w-7" />
              </span>
              <h1
                className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s.title}
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-mist">
                {s.tagline}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href={`/quote?service=${s.slug}`} variant="primary" size="lg">
                  Get a quote
                </Button>
                <Button href="/contact" variant="outline" size="lg">
                  Talk to an expert
                </Button>
              </div>
            </div>

            {/* Highlights card */}
            <Reveal delay={0.1}>
              <div className="glass rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
                  Why shippers choose it
                </p>
                <ul className="mt-4 space-y-3">
                  {s.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 text-sm text-foam">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${CHIP[s.color]}`}>
                        <Check className="h-3 w-3" />
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="relative py-12 lg:py-16">
        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <Reveal>
            <p className="text-lg leading-relaxed text-mist">{s.intro}</p>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {s.features.map((f, i) => {
              const FIcon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 0.06}>
                  <article className="h-full rounded-3xl border border-steel/70 bg-deep p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-cyan/40">
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl ${CHIP[s.color]}`}>
                      <FIcon className="h-6 w-6" />
                    </span>
                    <h3
                      className="mt-5 text-lg font-semibold text-foam"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-mist">{f.body}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="How it works" title="A clear path, end to end" />
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {s.steps.map((st, i) => (
              <Reveal key={st.title} delay={i * 0.06}>
                <div className="h-full rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${CHIP[s.color]}`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-foam">{st.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-mist">{st.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AI angle + stats */}
      <section className="relative py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="bg-aurora-gradient relative overflow-hidden rounded-3xl p-8 text-white shadow-soft md:p-12">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                  <Sparkles className="h-3.5 w-3.5" /> The AI Edge
                </span>
                <p
                  className="mt-3 text-xl font-medium leading-relaxed md:text-2xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.aiAngle}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 lg:grid-cols-1">
                {s.stats.map((st) => (
                  <div key={st.l}>
                    <p
                      className="text-3xl font-semibold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {st.v}
                    </p>
                    <p className="text-sm text-white/80">{st.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related + CTA */}
      <section className="relative py-12 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="Explore more" title="Related services" />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {related.map((r) => {
              const RIcon = r.icon;
              return (
                <Link
                  key={r.slug}
                  href={`/services/${r.slug}`}
                  className="group flex items-start gap-4 rounded-3xl border border-steel/70 bg-deep p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-cyan/40"
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${CHIP[r.color]}`}>
                    <RIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-foam">
                      {r.short}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="mt-0.5 block text-xs text-mist">{r.tagline}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
