export type AdvisorMessage = { role: "user" | "assistant"; content: string };

export type Cta = { label: string; href: string };

export type AdvisorResult =
  | { ok: true; content: string; cta?: Cta }
  | { ok: false; error: string };
