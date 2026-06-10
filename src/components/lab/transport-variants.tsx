/* eslint-disable @next/next/no-img-element */
/*
 * TRANSPORT IMAGERY — VARIANT LAB (throwaway)
 * Five ways to integrate realistic transport photos into the Nordic Frost
 * theme. Rendered together at /transport-lab so Timi can pick one. Once a
 * variant is approved, the winner gets productized and this file is deleted.
 *
 * Photos live in /public/transport/{ship,plane,train,truck}.jpg (Unsplash).
 */
import { Ship, Plane, Truck, Sparkles, ArrowRight } from "lucide-react";

const PHOTO = {
  ship: "/transport/ship.jpg",
  plane: "/transport/plane.jpg",
  train: "/transport/train.jpg",
  truck: "/transport/truck.jpg",
} as const;

const MODES = [
  { key: "ship", label: "Ocean", img: PHOTO.ship },
  { key: "plane", label: "Air", img: PHOTO.plane },
  { key: "truck", label: "Land", img: PHOTO.truck },
  { key: "train", label: "Rail", img: PHOTO.train },
] as const;

/* Shared placeholder hero copy so every variant is judged on the same content */
function HeroCopy({ onLight = true }: { onLight?: boolean }) {
  const ink = onLight ? "text-foam" : "text-white";
  const muted = onLight ? "text-mist" : "text-white/75";
  return (
    <div className="max-w-md">
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${
          onLight ? "border-cyan/25 bg-cyan/5 text-cyan" : "border-white/30 bg-white/10 text-white"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" /> Sea · Air · Land
      </span>
      <h3
        className={`mt-5 text-3xl font-semibold leading-[1.05] tracking-tight md:text-4xl ${ink}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        Every mode,{" "}
        <span className={onLight ? "text-gradient" : ""}>intelligently orchestrated.</span>
      </h3>
      <p className={`mt-4 text-base leading-relaxed ${muted}`}>
        Ocean, air, and land freight on one predictive backbone — visibility and
        optimization that follow your cargo across every leg.
      </p>
      <span
        className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${
          onLight ? "text-cyan" : "text-white"
        }`}
      >
        Explore services <ArrowRight className="h-4 w-4" />
      </span>
    </div>
  );
}

/* ============================================================
   VARIANT 1 — Cobalt Duotone Full-Bleed (Ken Burns)
   Photo recolored to the brand duotone, slow zoom, text on a
   page-bg scrim. Immersive + fully on-palette.
   ============================================================ */
function V1() {
  return (
    <div className="relative min-h-[460px] overflow-hidden rounded-3xl">
      <img
        src={PHOTO.ship}
        alt=""
        className="animate-kenburns absolute inset-0 h-full w-full object-cover [filter:grayscale(1)_contrast(1.05)]"
      />
      {/* duotone: shadows → cobalt/indigo, highlights → aqua */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(120deg,#1e5bff,#6e4bff)", mixBlendMode: "multiply" }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{ background: "linear-gradient(120deg,#5b8cff,#bcd0ff)", mixBlendMode: "screen" }}
      />
      {/* readability scrim toward the page background */}
      <div className="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/70 to-transparent" />
      <div className="relative z-10 flex min-h-[460px] items-center p-10 lg:p-14">
        <HeroCopy />
      </div>
    </div>
  );
}

/* ============================================================
   VARIANT 2 — Diagonal Clip-Split (editorial)
   Solid theme panel on the left with an angled edge, full-colour
   photo on the right, cobalt seam blend. Crisp + Swiss.
   ============================================================ */
function V2() {
  return (
    <div className="relative min-h-[460px] overflow-hidden rounded-3xl bg-deep">
      <img
        src={PHOTO.truck}
        alt=""
        className="absolute inset-y-0 right-0 h-full w-[62%] object-cover"
      />
      {/* cobalt wash over the photo to tie it to the palette */}
      <div
        className="absolute inset-y-0 right-0 w-[62%]"
        style={{ background: "linear-gradient(110deg, rgba(30,91,255,0.45), rgba(110,75,255,0.12) 55%, transparent)" }}
      />
      {/* angled solid panel */}
      <div
        className="absolute inset-y-0 left-0 w-[56%] bg-deep"
        style={{ clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)" }}
      />
      <div className="relative z-10 flex min-h-[460px] max-w-[52%] items-center p-10 lg:p-14">
        <HeroCopy />
      </div>
    </div>
  );
}

/* ============================================================
   VARIANT 3 — Floating Glass Photo Cards (collage)
   Real photos framed in the site's glass cards, floating at
   angles like the existing hero ETA/risk cards. Lowest clash risk.
   ============================================================ */
function PhotoCard({
  img,
  label,
  Icon,
  className,
  delay,
}: {
  img: string;
  label: string;
  Icon: typeof Ship;
  className: string;
  delay: string;
}) {
  return (
    <figure
      className={`glass animate-float absolute w-48 rounded-2xl p-1.5 shadow-xl md:w-56 ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="relative overflow-hidden rounded-xl">
        <img src={img} alt={label} className="h-28 w-full object-cover md:h-32" />
        <figcaption className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1.5 rounded-full bg-foam/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          <Icon className="h-3.5 w-3.5" /> {label}
        </figcaption>
      </div>
    </figure>
  );
}

function V3() {
  return (
    <div className="bg-grid relative min-h-[460px] overflow-hidden rounded-3xl bg-deep">
      <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-cyan/15 blur-[100px]" />
      <div className="relative z-10 flex min-h-[460px] items-center p-10 lg:p-14">
        <HeroCopy />
      </div>
      <PhotoCard img={PHOTO.ship} label="Ocean" Icon={Ship} delay="0s" className="right-[6%] top-[12%] rotate-[-4deg]" />
      <PhotoCard img={PHOTO.plane} label="Air" Icon={Plane} delay="-2.5s" className="right-[30%] top-[40%] rotate-[3deg]" />
      <PhotoCard img={PHOTO.truck} label="Land" Icon={Truck} delay="-1.2s" className="right-[8%] bottom-[10%] rotate-[2deg]" />
    </div>
  );
}

/* ============================================================
   VARIANT 4 — Tinted Mosaic Marquee (showcase band)
   A slow-scrolling strip of all four modes, cobalt-tinted, with
   page-bg edge fades. Best as a section band, not a hero.
   ============================================================ */
function V4() {
  const track = [...MODES, ...MODES];
  return (
    <div className="relative overflow-hidden rounded-3xl bg-navy py-10">
      <div className="px-10 pb-6">
        <HeroCopy />
      </div>
      <div className="relative">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-navy to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-navy to-transparent" />
        <div className="animate-marquee flex w-max gap-4 px-4">
          {track.map((m, i) => (
            <figure key={i} className="relative h-44 w-72 shrink-0 overflow-hidden rounded-2xl shadow-soft">
              <img src={m.img} alt={m.label} className="h-full w-full object-cover [filter:grayscale(0.4)]" />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(160deg, rgba(30,91,255,0.55), rgba(11,27,43,0.25))", mixBlendMode: "multiply" }}
              />
              <figcaption
                className="absolute bottom-3 left-3 text-lg font-semibold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {m.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VARIANT 5 — Ambient Tinted Wash (whisper-quiet)
   A single photo as a faint, masked, tinted texture behind normal
   content — photographic but melts into the page. Subtlest option.
   ============================================================ */
function V5() {
  return (
    <div className="relative min-h-[460px] overflow-hidden rounded-3xl bg-deep">
      <img
        src={PHOTO.ship}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.16]"
        style={{
          mixBlendMode: "luminosity",
          maskImage: "radial-gradient(120% 90% at 80% 30%, #000 25%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(120% 90% at 80% 30%, #000 25%, transparent 75%)",
        }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(30,91,255,0.10), transparent 60%)" }} />
      <div className="relative z-10 flex min-h-[460px] items-center p-10 lg:p-14">
        <HeroCopy />
      </div>
    </div>
  );
}

const VARIANTS = [
  { n: 1, name: "Cobalt Duotone Full-Bleed", desc: "Photo recolored to the brand duotone with a slow Ken Burns zoom and a page-bg scrim for text. Most immersive; fully on-palette.", Comp: V1 },
  { n: 2, name: "Diagonal Clip-Split", desc: "Solid theme panel with an angled edge meets a full-colour photo, joined by a cobalt seam. Crisp, editorial, very Swiss.", Comp: V2 },
  { n: 3, name: "Floating Glass Photo Cards", desc: "Real photos framed in the site's existing glass cards, floating at angles. Reuses your design language; lowest clash risk.", Comp: V3 },
  { n: 4, name: "Tinted Mosaic Marquee", desc: "A slow-scrolling, cobalt-tinted strip of all four modes with edge fades. Best as a showcase band between sections.", Comp: V4 },
  { n: 5, name: "Ambient Tinted Wash", desc: "A single photo as a faint, masked, tinted texture behind normal content. Photographic but whisper-quiet.", Comp: V5 },
];

export function TransportVariants() {
  return (
    <div className="space-y-16">
      {VARIANTS.map(({ n, name, desc, Comp }) => (
        <section key={n}>
          <div className="mb-4 flex items-baseline gap-3">
            <span
              className="bg-brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {n}
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
                Variant {n} — {name}
              </h2>
              <p className="mt-0.5 max-w-2xl text-sm text-mist">{desc}</p>
            </div>
          </div>
          <Comp />
        </section>
      ))}
    </div>
  );
}
