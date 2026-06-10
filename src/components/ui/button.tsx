import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "soft";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-cyan to-indigo text-white font-semibold shadow-[0_10px_30px_-8px_rgba(30,91,255,0.65)] hover:shadow-[0_16px_46px_-8px_rgba(110,75,255,0.7)] hover:-translate-y-0.5",
  soft: "glass text-foam hover:border-aqua/40 hover:-translate-y-0.5",
  outline:
    "border border-aqua/30 text-foam hover:bg-aqua/10 hover:border-aqua/60",
  ghost: "text-mist hover:text-foam hover:bg-steel/40",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-[3.25rem] px-7 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  // Strip the design-only props so the rest can flow to the native <button>.
  const rest = { ...props } as Partial<ButtonAsButton>;
  delete rest.variant;
  delete rest.size;
  delete rest.className;
  delete rest.children;
  delete (rest as { href?: string }).href;

  return (
    <button
      className={classes}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
