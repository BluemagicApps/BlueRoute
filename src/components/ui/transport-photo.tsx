/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/*
 * Cobalt Duotone Full-Bleed transport photography (productized from the
 * /transport-lab "Variant 1"). A realistic ship/plane/train/truck photo is
 * recolored to the brand duotone (shadows → cobalt/indigo, highlights → aqua)
 * with a slow Ken Burns zoom and a left-edge readability scrim toward the page
 * background, so hero copy stays legible on top.
 *
 * Server component, decorative only: aria-hidden, pointer-events-none, -z-10.
 * The global prefers-reduced-motion rule freezes the Ken Burns zoom.
 */

type Vehicle = "ship" | "plane" | "train" | "truck";

const PHOTO: Record<Vehicle, string> = {
  ship: "/transport/ship.jpg",
  plane: "/transport/plane.jpg",
  train: "/transport/train.jpg",
  truck: "/transport/truck.jpg",
};

export function TransportPhoto({
  vehicle = "ship",
  /* Any /public photo path; takes precedence over `vehicle`. Lets non-transport
     pages (warehousing, customs, about, …) reuse the same duotone treatment. */
  src,
  className,
  /* Tailwind gradient stops for the readability scrim. Defaults to a strong
     left wash fading right; pass a custom value for darker/lighter heroes. */
  scrim = "from-abyss via-abyss/75 to-abyss/10",
}: {
  vehicle?: Vehicle;
  src?: string;
  className?: string;
  scrim?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <img
        src={src ?? PHOTO[vehicle]}
        alt=""
        className="animate-kenburns absolute inset-0 h-full w-full object-cover [filter:grayscale(1)_contrast(1.05)]"
      />
      {/* duotone: shadows → cobalt/indigo */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(120deg,#1e5bff,#6e4bff)", mixBlendMode: "multiply" }}
      />
      {/* duotone: highlights → aqua */}
      <div
        className="absolute inset-0 opacity-60"
        style={{ background: "linear-gradient(120deg,#5b8cff,#bcd0ff)", mixBlendMode: "screen" }}
      />
      {/* readability scrim toward the page background */}
      <div className={cn("absolute inset-0 bg-gradient-to-r", scrim)} />
      {/* bottom fade so the full-bleed hero melts into the page below */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-abyss to-transparent" />
    </div>
  );
}
