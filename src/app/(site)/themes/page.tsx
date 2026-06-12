import type { Metadata } from "next";
import {
  Sora,
  Manrope,
  Fraunces,
  Space_Grotesk,
  JetBrains_Mono,
  Bricolage_Grotesque,
} from "next/font/google";
import { ThemeDemo, type ThemeConfig } from "@/components/themes/theme-demo";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Theme Variants",
  description: "Choose a visual direction for Blue Route Logistics.",
};

/* Distinctive fonts for each direction */
const sora = Sora({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "700", "800"] });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["400", "600", "700"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"] });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

const THEMES: ThemeConfig[] = [
  {
    id: 1,
    name: "Midnight Aurora",
    tagline: "Dark, glowing, futuristic — neon aurora over indigo glass.",
    mood: "Futuristic",
    fontDisplay: sora.style.fontFamily,
    fontBody: manrope.style.fontFamily,
    bgStyle: "aurora",
    radius: 18,
    glass: true,
    dark: true,
    headlineGradient: true,
    vars: {
      bg: "linear-gradient(160deg, #0b0a1f, #130f30)",
      surface: "rgba(255,255,255,0.045)",
      surfaceBorder: "rgba(124,92,255,0.28)",
      text: "#ECEAFF",
      muted: "#A7A3CF",
      primary: "#7C5CFF",
      primaryInk: "#ffffff",
      accent: "#22D3EE",
      accent2: "#C026D3",
    },
  },
  {
    id: 2,
    name: "Nordic Frost",
    tagline: "Light, crisp, Swiss-minimal — whitespace and one cobalt accent.",
    mood: "Crisp & minimal",
    fontDisplay: manrope.style.fontFamily,
    fontBody: manrope.style.fontFamily,
    bgStyle: "grid",
    radius: 14,
    glass: false,
    dark: false,
    headlineGradient: false,
    vars: {
      bg: "#F7F9FC",
      surface: "#FFFFFF",
      surfaceBorder: "#E4E9F0",
      text: "#0B1B2B",
      muted: "#5C6B7B",
      primary: "#1E5BFF",
      primaryInk: "#FFFFFF",
      accent: "#1E5BFF",
      accent2: "#5B8CFF",
    },
  },
  {
    id: 3,
    name: "Maritime Luxe",
    tagline: "Cream paper, deep teal, brass gold — editorial serif heritage.",
    mood: "Premium heritage",
    fontDisplay: fraunces.style.fontFamily,
    fontBody: manrope.style.fontFamily,
    bgStyle: "plain",
    radius: 10,
    glass: false,
    dark: false,
    headlineGradient: false,
    vars: {
      bg: "#F4EFE6",
      surface: "#FBF8F1",
      surfaceBorder: "#E3DAC9",
      text: "#15202B",
      muted: "#6E6151",
      primary: "#0E3B3B",
      primaryInk: "#F4EFE6",
      accent: "#C9A24B",
      accent2: "#0E3B3B",
    },
  },
  {
    id: 4,
    name: "Carbon Flux",
    tagline: "Near-black industrial, mono type, safety-amber & lime accents.",
    mood: "Technical & raw",
    fontDisplay: spaceGrotesk.style.fontFamily,
    fontBody: jetbrains.style.fontFamily,
    bgStyle: "industrial",
    radius: 6,
    glass: false,
    dark: true,
    headlineGradient: false,
    vars: {
      bg: "#0E0F12",
      surface: "#16181D",
      surfaceBorder: "#262A31",
      text: "#F2F3F5",
      muted: "#8A8F98",
      primary: "#FF7A1A",
      primaryInk: "#0E0F12",
      accent: "#FF7A1A",
      accent2: "#C6FF3D",
    },
  },
  {
    id: 5,
    name: "Tidal Gradient",
    tagline: "Bright, vibrant mesh gradients — teal to violet, soft & modern.",
    mood: "Vibrant & modern",
    fontDisplay: bricolage.style.fontFamily,
    fontBody: manrope.style.fontFamily,
    bgStyle: "mesh",
    radius: 20,
    glass: true,
    dark: false,
    headlineGradient: true,
    vars: {
      bg: "linear-gradient(160deg, #F0FBFF, #F3F0FF)",
      surface: "rgba(255,255,255,0.7)",
      surfaceBorder: "rgba(20,40,80,0.10)",
      text: "#0C1430",
      muted: "#5B6480",
      primary: "#7C3AED",
      primaryInk: "#FFFFFF",
      accent: "#0EB6C2",
      accent2: "#7C3AED",
    },
  },
];

export default function ThemesPage() {
  return (
    <section className="relative pt-28 pb-24 lg:pt-32">
      <div className="bg-grid absolute inset-0 -z-10 h-80" />

      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        {/* Intro */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            Theme Studio
          </span>
          <h1
            className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pick a visual direction
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-mist">
            Five advanced, fully distinct themes — each shown as a live preview of
            the Blue Route homepage with its own palette, typography, and mood.
            Tell me the number you like and I&apos;ll apply it across the entire
            site.
          </p>
        </div>

        {/* Demos */}
        <div className="mt-12 space-y-14">
          {THEMES.map((theme, i) => (
            <Reveal key={theme.id} delay={i * 0.04}>
              <div id={`theme-${theme.id}`} className="scroll-mt-28">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    className="text-xl font-semibold text-foam"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    <span className="text-cyan">
                      {String(theme.id).padStart(2, "0")}
                    </span>{" "}
                    · {theme.name}
                  </h2>
                  <p className="text-sm text-mist">{theme.tagline}</p>
                </div>
                <ThemeDemo theme={theme} />
              </div>
            </Reveal>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-14 rounded-3xl border border-cyan/20 bg-deep/40 p-6 text-center">
          <p className="text-foam">
            Like one? Just say{" "}
            <span className="font-semibold text-cyan">
              &ldquo;apply theme 3&rdquo;
            </span>{" "}
            (or mix-and-match — e.g. &ldquo;theme 2 but with theme 5&apos;s
            fonts&rdquo;) and I&apos;ll roll it out site-wide.
          </p>
        </div>
      </div>
    </section>
  );
}
