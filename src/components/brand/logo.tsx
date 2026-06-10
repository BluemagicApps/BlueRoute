import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Blue Route mark: a compass/route node emitting a cyan signal arc —
 * nautical + AI-signal motif. Pure SVG so it stays crisp and tiny.
 */
export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Blue Route Logistics — home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="relative grid h-9 w-9 place-items-center">
        <svg
          viewBox="0 0 40 40"
          className="h-9 w-9"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            className="stroke-steel"
            strokeWidth="1.5"
          />
          {/* route arc */}
          <path
            d="M7 27 Q20 4 33 13"
            className="stroke-cyan transition-[stroke-dashoffset] duration-700"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* signal rings */}
          <circle cx="33" cy="13" r="3.2" className="fill-cyan" />
          <circle
            cx="33"
            cy="13"
            r="6.5"
            className="stroke-aqua/50 group-hover:animate-spin-slow"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
          <circle cx="7" cy="27" r="2.4" className="fill-aqua" />
        </svg>
      </span>
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className="text-xl font-extrabold tracking-[-0.01em] text-foam"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Blue<span className="text-cyan"> Route</span>
          </span>
          <span className="text-[0.64rem] font-bold uppercase tracking-[0.34em] text-mist">
            Logistics
          </span>
        </span>
      )}
    </Link>
  );
}
