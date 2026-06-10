"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Opens the site-wide AI Advisor via a window event. */
export function OpenAdvisorButton({
  children = "Open the AI Advisor",
  variant = "primary",
  className,
}: {
  children?: React.ReactNode;
  variant?: "primary" | "light";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("br-open-assistant"))}
      className={cn(
        "inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-full px-7 text-base font-semibold transition-transform hover:-translate-y-0.5 active:scale-95",
        variant === "primary"
          ? "bg-gradient-to-br from-cyan to-indigo text-white shadow-[0_12px_36px_-8px_rgba(110,75,255,0.6)]"
          : "bg-white text-cyan shadow-lg",
        className
      )}
    >
      <Sparkles className="h-5 w-5" />
      {children}
    </button>
  );
}
