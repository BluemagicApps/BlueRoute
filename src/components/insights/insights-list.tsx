"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Mail, Check } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ARTICLES, type ArticleCategory } from "@/lib/insights-data";

const MotionLink = motion.create(Link);

const COLOR: Record<string, string> = {
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

const CATEGORIES: ("All" | ArticleCategory)[] = ["All", "Market", "AI & Tech", "Sustainability", "Operations"];

export function InsightsList() {
  const [active, setActive] = useState<"All" | ArticleCategory>("All");
  const featured = ARTICLES.find((a) => a.featured)!;
  const rest = useMemo(
    () => ARTICLES.filter((a) => !a.featured && (active === "All" || a.category === active)),
    [active]
  );

  return (
    <div>
      {/* Featured */}
      <div className="group grid overflow-hidden rounded-3xl border border-steel/70 bg-deep shadow-soft md:grid-cols-2">
        <div className={cn("relative min-h-[220px] bg-gradient-to-br", COLOR[featured.color])}>
          <div className="absolute inset-0 bg-grid opacity-30" />
          <span className="absolute left-5 top-5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            Featured
          </span>
        </div>
        <div className="p-7 lg:p-9">
          <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", TAG[featured.category])}>
            {featured.category}
          </span>
          <h2
            className="mt-3 text-2xl font-semibold leading-tight text-foam"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {featured.title}
          </h2>
          <p className="mt-3 text-mist">{featured.excerpt}</p>
          <div className="mt-5 flex items-center gap-4 text-xs text-mist">
            <span>{featured.date}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {featured.readMin} min read
            </span>
          </div>
          <Link
            href={`/insights/${featured.slug}`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan"
          >
            Read article <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="mt-10 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === c
                ? "border-cyan/50 bg-cyan/10 text-cyan"
                : "border-steel/70 bg-white text-mist hover:border-cyan/30"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((a, i) => (
          <MotionLink
            key={a.title}
            href={`/insights/${a.slug}`}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.04, ease: EASE_OUT_EXPO }}
            className="group flex flex-col overflow-hidden rounded-3xl border border-steel/70 bg-deep text-left shadow-soft transition-all hover:-translate-y-1 hover:border-cyan/40"
          >
            <div className={cn("relative h-32 bg-gradient-to-br", COLOR[a.color])}>
              <div className="absolute inset-0 bg-grid opacity-30" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <span className={cn("w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold", TAG[a.category])}>
                {a.category}
              </span>
              <h3 className="mt-3 text-base font-semibold leading-snug text-foam">{a.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{a.excerpt}</p>
              <div className="mt-4 flex items-center gap-3 text-xs text-mist">
                <span>{a.date}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {a.readMin} min
                </span>
              </div>
            </div>
          </MotionLink>
        ))}
      </div>

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="bg-aurora-gradient relative mt-12 overflow-hidden rounded-3xl p-8 text-white shadow-soft md:p-10">
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
      <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
        <div className="max-w-md">
          <h3 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            The logistics intelligence brief
          </h3>
          <p className="mt-2 text-white/85">
            Market signals, AI insights, and rate outlooks — every other week.
          </p>
        </div>
        {done ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-3 text-sm font-semibold backdrop-blur">
            <Check className="h-4 w-4" /> You&apos;re subscribed!
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) setDone(true);
            }}
            className="flex w-full max-w-sm items-center gap-2 rounded-full bg-white/15 p-1.5 pl-4 backdrop-blur"
          >
            <Mail className="h-4 w-4 shrink-0 text-white/80" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label="Email address"
              className="h-9 w-full bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!valid}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-cyan disabled:opacity-50"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
