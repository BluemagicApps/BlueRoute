import { ArrowLeft, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Polished "in progress" page for routes scaffolded but not yet built out.
 * Keeps navigation coherent while the rest of the platform is implemented.
 */
export function PagePlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden pt-32 pb-20">
      <div className="bg-grid absolute inset-0 -z-10" />
      <div className="absolute left-1/2 top-20 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan/10 blur-[120px] animate-aurora" />

      <div className="mx-auto max-w-2xl px-5 text-center lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
          <Hammer className="h-3.5 w-3.5" />
          {eyebrow}
        </span>
        <h1
          className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foam md:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-mist">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/" variant="soft" size="lg">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Button>
          <Button href="/contact" variant="primary" size="lg">
            Talk to our team
          </Button>
        </div>
      </div>
    </section>
  );
}
