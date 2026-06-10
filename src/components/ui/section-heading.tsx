import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-float" />
          {eyebrow}
        </span>
      )}
      <h2
        className="mt-4 text-balance text-3xl font-semibold leading-[1.08] tracking-tight text-foam md:text-4xl lg:text-[2.75rem]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-pretty text-base leading-relaxed text-mist md:text-lg">
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
