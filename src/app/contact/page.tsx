import type { Metadata } from "next";
import {
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Sparkles,
  Building2,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Blue Route Logistics — sales, support, and warehouse leasing. Send an inquiry, reach a global office, or ask the AI Advisor instantly.",
};

const CHANNELS = [
  {
    icon: Mail,
    color: "cyan",
    label: "Sales & quoting",
    value: "sales@blueroute.example.com",
    note: "Replies within 2 business hours",
  },
  {
    icon: MessageSquare,
    color: "indigo",
    label: "Customer support",
    value: "support@blueroute.example.com",
    note: "24/7 for active shipments",
  },
  {
    icon: Phone,
    color: "teal",
    label: "Phone (global)",
    value: "+31 10 000 0000",
    note: "Mon–Fri, 08:00–20:00 CET",
  },
];

const OFFICES = [
  { city: "Rotterdam", country: "Netherlands", role: "Global HQ", tz: "CET" },
  { city: "Singapore", country: "Singapore", role: "APAC hub", tz: "SGT" },
  { city: "Dubai", country: "UAE", role: "MEA hub", tz: "GST" },
  { city: "Los Angeles", country: "USA", role: "Americas hub", tz: "PST" },
];

const CHIP: Record<string, string> = {
  cyan: "bg-cyan/10 text-cyan",
  indigo: "bg-indigo/10 text-indigo",
  teal: "bg-teal/10 text-teal",
};

export default function ContactPage() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-80" />
      <div className="absolute -right-32 top-10 -z-10 h-[26rem] w-[26rem] rounded-full bg-indigo/20 blur-[120px] animate-aurora" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            <MessageSquare className="h-3.5 w-3.5" /> Contact
          </span>
          <h1
            className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Let&apos;s move your cargo — <span className="text-gradient">intelligently.</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-mist">
            Reach the right team in minutes, or get instant answers from the
            BlueRoute AI Advisor any time.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Form */}
          <Reveal>
            <ContactForm />
          </Reveal>

          {/* Side info */}
          <div className="space-y-5">
            <Reveal delay={0.05}>
              <div className="space-y-3">
                {CHANNELS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.label}
                      className="flex items-start gap-4 rounded-2xl border border-steel/70 bg-deep p-4 shadow-soft"
                    >
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${CHIP[c.color]}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foam">{c.label}</p>
                        <p className="text-sm text-cyan">{c.value}</p>
                        <p className="text-xs text-mist">{c.note}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            {/* AI advisor highlight */}
            <Reveal delay={0.1}>
              <div className="bg-aurora-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-soft">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
                <span className="relative inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                  <Sparkles className="h-3.5 w-3.5" /> Fastest answer
                </span>
                <p className="relative mt-2 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  The AI Advisor is online 24/7
                </p>
                <p className="relative mt-1 text-sm text-white/85">
                  Quotes, tracking, risk, and warehouse matching — instantly. Look
                  for the button in the bottom-right corner.
                </p>
              </div>
            </Reveal>

            {/* Offices */}
            <Reveal delay={0.15}>
              <div className="rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft">
                <h3
                  className="flex items-center gap-2 text-base font-semibold text-foam"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <Building2 className="h-5 w-5 text-cyan" /> Global offices
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {OFFICES.map((o) => (
                    <div key={o.city} className="rounded-2xl bg-abyss p-3">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-foam">
                        <MapPin className="h-3.5 w-3.5 text-cyan" /> {o.city}
                      </p>
                      <p className="text-xs text-mist">{o.country}</p>
                      <p className="mt-1 flex items-center gap-1 text-[0.7rem] text-mist">
                        <Clock className="h-3 w-3" /> {o.role} · {o.tz}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
