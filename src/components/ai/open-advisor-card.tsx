"use client";

/** Wraps card content so clicking it opens the site-wide AI Advisor. */
export function OpenAdvisorCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("br-open-assistant"))}
      className={className}
    >
      {children}
    </button>
  );
}
