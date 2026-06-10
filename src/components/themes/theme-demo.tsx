import {
  Ship,
  Boxes,
  Sparkles,
  ArrowRight,
  Anchor,
  Search,
  type LucideIcon,
} from "lucide-react";

export type ThemeVars = {
  bg: string; // page background (can be a gradient)
  surface: string; // card background
  surfaceBorder: string;
  text: string;
  muted: string;
  primary: string; // solid button bg
  primaryInk: string; // text on primary
  accent: string;
  accent2: string;
};

export type ThemeConfig = {
  id: number;
  name: string;
  tagline: string;
  mood: string;
  fontDisplay: string;
  fontBody: string;
  vars: ThemeVars;
  bgStyle: "aurora" | "grid" | "mesh" | "industrial" | "plain";
  radius: number;
  glass: boolean;
  dark: boolean;
  headlineGradient: boolean;
};

const FEATURES: { icon: LucideIcon; title: string; line: string }[] = [
  { icon: Ship, title: "Ocean Freight", line: "FCL & LCL on every lane" },
  { icon: Boxes, title: "Door-to-Door", line: "One accountable contract" },
  { icon: Anchor, title: "Warehousing", line: "AI-matched smart space" },
];

const STATS = [
  { v: "180+", l: "Countries" },
  { v: "2.4M", l: "Containers / yr" },
  { v: "94%", l: "On-time (AI)" },
];

export function ThemeDemo({ theme }: { theme: ThemeConfig }) {
  const v = theme.vars;
  const r = theme.radius;

  const cardStyle: React.CSSProperties = theme.glass
    ? {
        background: v.surface,
        border: `1px solid ${v.surfaceBorder}`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }
    : { background: v.surface, border: `1px solid ${v.surfaceBorder}` };

  const headlineStyle: React.CSSProperties = theme.headlineGradient
    ? {
        fontFamily: theme.fontDisplay,
        backgroundImage: `linear-gradient(100deg, ${v.text}, ${v.accent} 55%, ${v.accent2})`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }
    : { fontFamily: theme.fontDisplay, color: v.text };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: v.bg,
        color: v.text,
        fontFamily: theme.fontBody,
        borderRadius: r + 8,
        border: `1px solid ${v.surfaceBorder}`,
      }}
    >
      <Backdrop theme={theme} />

      <div className="relative z-10 p-6 sm:p-9">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 place-items-center"
              style={{
                borderRadius: r,
                background: `linear-gradient(135deg, ${v.accent}, ${v.accent2})`,
                color: v.primaryInk,
              }}
            >
              <Ship className="h-4 w-4" />
            </span>
            <span
              className="text-base font-semibold tracking-tight"
              style={{ fontFamily: theme.fontDisplay, color: v.text }}
            >
              Blue Route
            </span>
          </div>
          <div className="hidden items-center gap-5 text-sm sm:flex" style={{ color: v.muted }}>
            <span>Services</span>
            <span>Tracking</span>
            <span>AI Edge</span>
          </div>
          <button
            className="text-sm font-semibold"
            style={{
              background: v.primary,
              color: v.primaryInk,
              borderRadius: 999,
              padding: "8px 16px",
            }}
          >
            Get Quote
          </button>
        </div>

        {/* Hero */}
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em]"
              style={{
                color: v.accent,
                background: `${v.accent}1a`,
                border: `1px solid ${v.accent}33`,
                borderRadius: 999,
                padding: "5px 12px",
              }}
            >
              <Sparkles className="h-3 w-3" /> The AI Edge
            </span>
            <h3
              className="mt-4 text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl"
              style={headlineStyle}
            >
              Intelligent global shipping, engineered to never surprise you.
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: v.muted }}>
              Door-to-door container shipping with predictive ETAs, proactive
              risk mitigation, and smart warehouse leasing.
            </p>

            {/* Track bar */}
            <div
              className="mt-6 flex items-center gap-2 p-1.5 pl-3"
              style={{ ...cardStyle, borderRadius: r }}
            >
              <Search className="h-4 w-4" style={{ color: v.accent }} />
              <span className="flex-1 text-xs" style={{ color: v.muted }}>
                Track by container #, B/L, or reference
              </span>
              <button
                className="text-xs font-semibold"
                style={{
                  background: v.primary,
                  color: v.primaryInk,
                  borderRadius: 999,
                  padding: "7px 14px",
                }}
              >
                Track
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                className="inline-flex items-center gap-2 text-sm font-semibold"
                style={{
                  background: v.primary,
                  color: v.primaryInk,
                  borderRadius: 999,
                  padding: "10px 18px",
                }}
              >
                Get Instant Quote <ArrowRight className="h-4 w-4" />
              </button>
              <button
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{
                  color: v.text,
                  border: `1px solid ${v.surfaceBorder}`,
                  borderRadius: 999,
                  padding: "10px 18px",
                }}
              >
                Ask the AI Advisor
              </button>
            </div>
          </div>

          {/* Visual orb */}
          <div className="relative mx-auto hidden aspect-square w-full max-w-[16rem] lg:block">
            <div
              className="absolute inset-0"
              style={{
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, ${v.accent}, ${v.accent2} 70%, transparent)`,
                opacity: theme.dark ? 0.85 : 0.9,
                filter: "blur(2px)",
              }}
            />
            <div
              className="absolute inset-6"
              style={{
                borderRadius: "50%",
                border: `1px dashed ${v.surfaceBorder}`,
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2"
              style={{ borderRadius: "50%", background: v.primaryInk }}
            />
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-9 grid gap-3 sm:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-4" style={{ ...cardStyle, borderRadius: r }}>
                <span
                  className="grid h-9 w-9 place-items-center"
                  style={{ background: `${v.accent}1f`, color: v.accent, borderRadius: r * 0.7 }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-sm font-semibold" style={{ color: v.text }}>
                  {f.title}
                </p>
                <p className="text-xs" style={{ color: v.muted }}>
                  {f.line}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-4 p-4"
          style={{ ...cardStyle, borderRadius: r }}
        >
          {STATS.map((s) => (
            <div key={s.l}>
              <p
                className="text-2xl font-semibold"
                style={{ fontFamily: theme.fontDisplay, color: v.text }}
              >
                {s.v}
              </p>
              <p className="text-xs" style={{ color: v.muted }}>
                {s.l}
              </p>
            </div>
          ))}
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: v.accent }}
          >
            {theme.mood}
          </span>
        </div>
      </div>
    </div>
  );
}

/* Per-theme background treatments */
function Backdrop({ theme }: { theme: ThemeConfig }) {
  const v = theme.vars;
  switch (theme.bgStyle) {
    case "aurora":
      return (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -left-20 -top-24 h-72 w-72 rounded-full"
            style={{ background: v.accent, opacity: 0.35, filter: "blur(90px)" }}
          />
          <div
            className="absolute -right-16 top-10 h-72 w-72 rounded-full"
            style={{ background: v.accent2, opacity: 0.3, filter: "blur(90px)" }}
          />
        </div>
      );
    case "grid":
      return (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${v.surfaceBorder} 1px, transparent 1px), linear-gradient(90deg, ${v.surfaceBorder} 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, #000 40%, transparent 80%)",
            opacity: 0.5,
          }}
        />
      );
    case "mesh":
      return (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(at 18% 18%, ${v.accent}55 0px, transparent 50%), radial-gradient(at 82% 12%, ${v.accent2}55 0px, transparent 45%), radial-gradient(at 75% 85%, ${v.primary}40 0px, transparent 50%)`,
          }}
        />
      );
    case "industrial":
      return (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${v.surfaceBorder} 1px, transparent 1px), linear-gradient(90deg, ${v.surfaceBorder} 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
              opacity: 0.4,
            }}
          />
          <div
            className="absolute right-0 top-0 h-1.5 w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, ${v.accent} 0 12px, transparent 12px 24px)`,
              opacity: 0.7,
            }}
          />
        </div>
      );
    default:
      return (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{ background: `linear-gradient(${v.accent}14, transparent)` }}
        />
      );
  }
}
