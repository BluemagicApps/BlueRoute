import type { ServiceQuoteConfig } from "@/lib/quote/service-fields";

export type ServiceQuoteInput = {
  slug: string;
  values: Record<string, string | string[]>;
  name: string;
  email: string;
  company: string;
  phone: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmpty(v: string | string[] | undefined): boolean {
  if (Array.isArray(v)) return v.length === 0;
  return !v || !v.trim();
}

export function validateServiceQuote(
  config: ServiceQuoteConfig,
  input: ServiceQuoteInput,
): Record<string, string> {
  const e: Record<string, string> = {};
  for (const f of config.fields) {
    if (f.required && isEmpty(input.values[f.name])) {
      e[f.name] = `${f.label} is required.`;
    }
  }
  if (!input.name.trim()) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(input.email)) e.email = "Enter a valid email.";
  return e;
}

/** Pure assembler for the bookings.details jsonb payload (type='service'). */
export function buildServiceDetails(
  config: ServiceQuoteConfig,
  input: ServiceQuoteInput,
): Record<string, unknown> {
  const details: Record<string, unknown> = { service: config.title };
  for (const f of config.fields) {
    const v = input.values[f.name];
    if (!isEmpty(v)) details[f.name] = v;
  }
  if (input.phone) details.phone = input.phone;
  details.summary = buildSummary(config, input.values);
  return details;
}

function buildSummary(
  config: ServiceQuoteConfig,
  values: Record<string, string | string[]>,
): string {
  const parts: string[] = [];
  for (const f of config.fields) {
    if (parts.length >= 3) break;
    if (f.type === "textarea" || f.type === "multiselect") continue;
    const v = values[f.name];
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
  }
  return parts.length ? parts.join(" · ") : config.title;
}
