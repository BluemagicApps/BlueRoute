import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

/*
 * Ambient transport line-art that drifts slowly behind content.
 * Pure CSS animation (no JS) → lightweight, and the global
 * `prefers-reduced-motion` rule in globals.css freezes it automatically.
 * Decorative only: aria-hidden, pointer-events-none, sits at -z-10.
 */

type Vehicle = "ship" | "plane" | "train" | "truck";
type Mode = "all" | Vehicle;

const sharedSvg = "h-auto w-full";
const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
};

function ShipArt() {
  return (
    <svg viewBox="0 0 160 80" className={sharedSvg} {...stroke}>
      {/* hull */}
      <path d="M10 50 L150 50 L138 64 L24 64 Z" />
      {/* bridge / superstructure */}
      <path d="M120 50 L120 36 L140 36 L140 50" />
      {/* stacked containers */}
      <path d="M28 50 L28 42 L116 42 L116 50 M44 42 L44 50 M60 42 L60 50 M76 42 L76 50 M92 42 L92 50 M104 42 L104 50 M28 46 L116 46" />
      {/* crane mast */}
      <path d="M132 36 L132 26 M126 30 L138 30" />
      {/* waterline */}
      <path d="M6 71 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" />
    </svg>
  );
}

function PlaneArt() {
  return (
    <svg viewBox="0 0 128 64" className={sharedSvg} {...stroke}>
      {/* tail fin */}
      <path d="M4 36 L4 24 L13 30" />
      {/* fuselage (nose to the right) */}
      <path d="M8 38 C8 33 14 31 22 31 L96 31 C108 31 120 33 124 36 C120 39 108 40 96 40 L22 40 C14 40 8 39 8 38 Z" />
      {/* swept wings */}
      <path d="M58 40 L72 56 L82 56 L70 40" />
      <path d="M50 31 L60 15 L68 15 L60 31" />
    </svg>
  );
}

function TrainArt() {
  return (
    <svg viewBox="0 0 160 70" className={sharedSvg} {...stroke}>
      {/* locomotive */}
      <path d="M10 48 L10 28 Q10 22 20 22 L64 22 L64 48 Z" />
      {/* loco windows */}
      <path d="M18 28 L30 28 L30 36 L18 36 Z M40 28 L58 28 L58 36 L40 36 Z" />
      {/* wagon */}
      <path d="M74 26 L150 26 L150 48 L74 48 Z" />
      {/* wheels */}
      <circle cx="24" cy="52" r="4" />
      <circle cx="52" cy="52" r="4" />
      <circle cx="92" cy="52" r="4" />
      <circle cx="134" cy="52" r="4" />
      {/* track */}
      <path d="M2 58 L158 58" />
    </svg>
  );
}

function TruckArt() {
  return (
    <svg viewBox="0 0 160 80" className={sharedSvg} {...stroke}>
      {/* trailer */}
      <path d="M60 18 L150 18 L150 56 L60 56 Z" />
      {/* cab with sloped windshield */}
      <path d="M18 56 L18 34 L40 34 L52 44 L60 44 L60 56 Z" />
      {/* cab window */}
      <path d="M24 38 L38 38 L44 44 L24 44 Z" />
      {/* wheels */}
      <circle cx="36" cy="60" r="6" />
      <circle cx="108" cy="60" r="6" />
      <circle cx="130" cy="60" r="6" />
      {/* ground */}
      <path d="M4 68 L156 68" />
    </svg>
  );
}

const ART = {
  ship: ShipArt,
  plane: PlaneArt,
  train: TrainArt,
  truck: TruckArt,
} satisfies Record<Vehicle, () => ReactElement>;

const SOLO_COLOR: Record<Vehicle, string> = {
  ship: "text-cyan",
  plane: "text-aqua",
  train: "text-teal",
  truck: "text-teal",
};

function Drifter({
  art,
  className,
  delay,
  slow,
}: {
  art: Vehicle;
  className: string;
  delay: string;
  slow?: boolean;
}) {
  const Art = ART[art];
  return (
    <span
      className={cn("absolute block", slow ? "animate-cruise-slow" : "animate-cruise", className)}
      style={{ animationDelay: delay }}
    >
      <Art />
    </span>
  );
}

export function TransportBackdrop({
  mode = "all",
  className,
}: {
  mode?: Mode;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      {mode === "all" ? (
        <>
          <Drifter art="plane" delay="0s" className="right-[7%] top-[12%] w-44 text-aqua opacity-[0.10] md:w-60" />
          <Drifter art="ship" delay="-7s" slow className="-left-6 bottom-[8%] w-60 text-cyan opacity-[0.09] md:w-80" />
          <Drifter art="train" delay="-13s" className="right-[3%] bottom-[14%] w-52 text-teal opacity-[0.08] md:w-64" />
          <Drifter art="truck" delay="-19s" slow className="left-[8%] top-[24%] w-44 text-teal opacity-[0.08] md:w-52" />
        </>
      ) : (
        <Drifter
          art={mode}
          delay="0s"
          slow
          className={cn(
            "right-[-2%] top-1/2 w-72 -translate-y-1/2 opacity-[0.07] md:w-[30rem]",
            SOLO_COLOR[mode],
          )}
        />
      )}
    </div>
  );
}
