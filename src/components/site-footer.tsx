import Link from "next/link";
import { ArrowUpRight, Globe } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { FOOTER_COLUMNS } from "@/lib/navigation";

/* Brand glyphs (lucide dropped its brand icons) */
function IconLinkedIn(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}
function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z" />
    </svg>
  );
}
function IconGitHub(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-[2] mt-24 border-t border-steel/50 bg-deep/60">
      {/* CTA band */}
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="bg-aurora-gradient relative -translate-y-16 overflow-hidden rounded-3xl p-8 shadow-soft md:p-12">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2
                className="text-3xl font-semibold tracking-tight text-white md:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Ship smarter. <span className="text-white/85">Starting today.</span>
              </h2>
              <p className="mt-3 text-white/80">
                Get an AI-optimized quote in under 60 seconds — or talk to the
                BlueRoute AI Advisor about your next shipment.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/quote"
                className="inline-flex h-[3.25rem] items-center justify-center rounded-full bg-white px-7 text-base font-semibold text-cyan shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                Get Instant Quote
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-[3.25rem] items-center justify-center rounded-full border border-white/50 px-7 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                Talk to an Expert
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Link grid */}
      <div className="mx-auto -mt-6 max-w-7xl px-5 pb-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
              Intelligent global shipping. AI-powered precision. Door-to-door
              container logistics and smart warehouse leasing to and from any
              country.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                { icon: IconLinkedIn, label: "LinkedIn" },
                { icon: IconX, label: "X" },
                { icon: IconGitHub, label: "GitHub" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-steel/60 text-mist transition-all hover:border-cyan/50 hover:text-cyan"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foam/80">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-mist transition-colors hover:text-foam"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-steel/50 pt-6 text-sm text-mist md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Blue Route Logistics. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button className="inline-flex items-center gap-1.5 transition-colors hover:text-foam">
              <Globe className="h-3.5 w-3.5" /> English (Global)
            </button>
            <Link href="/privacy" className="hover:text-foam">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foam">
              Terms
            </Link>
            <Link href="/sustainability" className="hover:text-foam">
              Sustainability
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
