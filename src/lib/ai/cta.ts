import type { Cta } from "./types";

const ALLOWED = new Set(["/quote", "/tracking", "/warehousing", "/services", "/contact"]);

/**
 * Pulls an optional trailing `CTA: /path | Label` line out of the reply.
 * Strips the directive line whether or not it was valid; only returns a `cta`
 * when the path is an allowed internal route.
 */
export function extractCta(raw: string): { content: string; cta?: Cta } {
  const lines = raw.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue; // skip trailing blank lines
    if (/^CTA:/i.test(line)) {
      const content = lines.slice(0, i).join("\n").trim();
      const m = line.match(/^CTA:\s*(\/[a-z]+)\s*\|\s*(.+)$/i);
      if (m && ALLOWED.has(m[1].toLowerCase())) {
        return { content, cta: { href: m[1].toLowerCase(), label: m[2].trim() } };
      }
      return { content }; // malformed or disallowed → strip silently
    }
    break; // last non-empty line isn't a directive
  }
  return { content: raw.trim() };
}
