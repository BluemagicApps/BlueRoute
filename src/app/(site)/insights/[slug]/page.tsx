import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock } from "lucide-react";
import { ARTICLES, getArticle, type ArticleCategory, type ArticleColor } from "@/lib/insights-data";
import { Reveal } from "@/components/ui/reveal";
import { Newsletter } from "@/components/insights/insights-list";

const COLOR: Record<ArticleColor, string> = {
  cyan: "from-cyan to-indigo",
  indigo: "from-indigo to-rose",
  teal: "from-teal to-cyan",
  emerald: "from-emerald to-teal",
  amber: "from-amber to-rose",
};
const TAG: Record<ArticleCategory, string> = {
  Market: "bg-indigo/10 text-indigo",
  "AI & Tech": "bg-cyan/10 text-cyan",
  Sustainability: "bg-emerald/10 text-emerald",
  Operations: "bg-amber/10 text-amber",
};

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "Insights" };
  return { title: a.title, description: a.excerpt };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const sameCat = ARTICLES.filter((x) => x.slug !== a.slug && x.category === a.category);
  const related = (sameCat.length ? sameCat : ARTICLES.filter((x) => x.slug !== a.slug)).slice(0, 2);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-10 lg:pt-40">
        <div className={`absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-br ${COLOR[a.color]} opacity-15`} />
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <Link href="/insights" className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-foam">
            <ArrowLeft className="h-4 w-4" /> All insights
          </Link>
          <span className={`mt-6 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TAG[a.category]}`}>
            {a.category}
          </span>
          <h1
            className="mt-3 text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foam md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {a.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-mist">
            <span className="font-medium text-foam">{a.author.name}</span>
            <span>{a.author.role}</span>
            <span>{a.date}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {a.readMin} min read
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <article className="relative pb-14">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          {a.body.map((section, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div className="mt-8 first:mt-0">
                {section.heading && (
                  <h2
                    className="mb-3 text-xl font-semibold text-foam"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {section.heading}
                  </h2>
                )}
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="mt-4 text-base leading-relaxed text-mist first:mt-0">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </article>

      {/* Related */}
      <section className="relative py-10">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-mist">Related reading</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/insights/${r.slug}`}
                className="group rounded-3xl border border-steel/70 bg-deep p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-cyan/40"
              >
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TAG[r.category]}`}>
                  {r.category}
                </span>
                <h3 className="mt-3 flex items-start gap-1 text-base font-semibold leading-snug text-foam">
                  {r.title}
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-cyan transition-transform group-hover:translate-x-0.5" />
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative pb-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Newsletter />
        </div>
      </section>
    </>
  );
}
