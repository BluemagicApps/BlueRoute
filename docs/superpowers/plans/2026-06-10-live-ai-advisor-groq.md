# Live AI Advisor (Groq) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mocked rule-based AI Advisor with a real Groq-powered, prompt-only, non-streaming conversational assistant grounded in BlueRoute's actual services and ports.

**Architecture:** A Next.js Server Action `askAdvisor(messages)` builds a grounded system prompt, applies input validation + a light per-IP rate limit, calls Groq once (non-streaming), extracts an optional CTA directive, and returns the reply. The existing client chat panel calls it directly.

**Tech Stack:** Next.js 16.2.7 (Server Actions), React 19, `groq-sdk` (default `import Groq from "groq-sdk"`, `groq.chat.completions.create`), Vitest, TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-10-live-ai-advisor-groq-design.md`

---

## File structure

**New:**
- `src/lib/ai/types.ts` — `AdvisorMessage`, `Cta`, `AdvisorResult`.
- `src/lib/ai/system-prompt.ts` — `buildSystemPrompt()` from live `SERVICES` + `PORTS`.
- `src/lib/ai/cta.ts` — `extractCta(raw)` directive parser.
- `src/lib/ai/rate-limit.ts` — in-memory sliding-window limiter.
- `src/lib/ai/groq.ts` — server-only Groq client + `chat()`.
- `src/app/actions/advisor.ts` — `askAdvisor` server action.
- Tests colocated as `*.test.ts`.

**Modified:**
- `src/components/ai/ai-assistant.tsx` — call `askAdvisor`; drop mock + fake steps.
- `.env.local` — add `GROQ_API_KEY` (Timi, guided).

---

### Task 1: AI types + grounded system prompt

**Files:**
- Create: `src/lib/ai/types.ts`, `src/lib/ai/system-prompt.ts`
- Test: `src/lib/ai/system-prompt.test.ts`

- [ ] **Step 1: Create the types**

`src/lib/ai/types.ts`:
```ts
export type AdvisorMessage = { role: "user" | "assistant"; content: string };

export type Cta = { label: string; href: string };

export type AdvisorResult =
  | { ok: true; content: string; cta?: Cta }
  | { ok: false; error: string };
```

- [ ] **Step 2: Write the failing test**

`src/lib/ai/system-prompt.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./system-prompt";

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt();

  it("identifies the BlueRoute advisor", () => {
    expect(prompt).toContain("BlueRoute AI Advisor");
  });
  it("includes a real service and a real port", () => {
    expect(prompt).toContain("Ocean Freight");
    expect(prompt).toContain("Rotterdam");
  });
  it("states the no-binding-quotes guardrail and CTA convention", () => {
    expect(prompt.toLowerCase()).toContain("never invent");
    expect(prompt).toContain("CTA:");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- system-prompt`
Expected: FAIL — cannot find module `./system-prompt`.

- [ ] **Step 4: Implement the prompt builder**

`src/lib/ai/system-prompt.ts`:
```ts
import { SERVICES } from "@/lib/services-data";
import { PORTS } from "@/lib/quote-data";

/** Grounded system prompt, assembled from live site data so it never drifts. */
export function buildSystemPrompt(): string {
  const services = SERVICES.map((s) => `- ${s.title}: ${s.tagline}`).join("\n");
  const ports = PORTS.map((p) => `${p.city} (${p.code})`).join(", ");

  return `You are the BlueRoute AI Advisor, the assistant for Blue Route Logistics, a premium AI-driven global freight forwarder.

You can help with: instant quoting, shipment tracking, risk analysis, multi-leg route planning, and warehouse matching.

Services offered:
${services}

Ports currently served: ${ports}.

Guidelines:
- Be concise, professional and genuinely helpful — a premium concierge tone.
- Stay strictly on logistics, freight, shipping, warehousing and Blue Route's services. Politely decline unrelated topics.
- Never invent binding prices, exact ETAs or guarantees. For a real quote, direct the user to the quote tool; for live tracking, direct them to the tracking tool.
- Do not give legal, customs-compliance or financial guarantees; suggest speaking to a specialist for those.
- When an on-site action would genuinely help, you MAY end your reply with exactly one line:
  CTA: /path | Button label
  where /path is one of /quote, /tracking, /warehousing, /services, /contact. Never include more than one, and only when useful.`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- system-prompt`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```powershell
git add src/lib/ai/types.ts src/lib/ai/system-prompt.ts src/lib/ai/system-prompt.test.ts
git commit -m "Add AI advisor types and grounded system prompt"
```

---

### Task 2: CTA directive extraction

**Files:**
- Create: `src/lib/ai/cta.ts`
- Test: `src/lib/ai/cta.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/ai/cta.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { extractCta } from "./cta";

describe("extractCta", () => {
  it("parses a valid trailing CTA and strips it from content", () => {
    const r = extractCta("Here's a plan for you.\nCTA: /quote | Get an instant quote");
    expect(r.content).toBe("Here's a plan for you.");
    expect(r.cta).toEqual({ href: "/quote", label: "Get an instant quote" });
  });
  it("drops a CTA pointing at a disallowed path (and removes the line)", () => {
    const r = extractCta("Sure.\nCTA: /evil | Click me");
    expect(r.content).toBe("Sure.");
    expect(r.cta).toBeUndefined();
  });
  it("returns content unchanged when there is no directive", () => {
    const r = extractCta("Just a normal answer.");
    expect(r.content).toBe("Just a normal answer.");
    expect(r.cta).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- cta`
Expected: FAIL — cannot find module `./cta`.

- [ ] **Step 3: Implement the extractor**

`src/lib/ai/cta.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- cta`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/lib/ai/cta.ts src/lib/ai/cta.test.ts
git commit -m "Add CTA directive extraction for AI advisor"
```

---

### Task 3: In-memory rate limiter

**Files:**
- Create: `src/lib/ai/rate-limit.ts`
- Test: `src/lib/ai/rate-limit.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/ai/rate-limit.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, __resetRateLimit } from "./rate-limit";

beforeEach(() => __resetRateLimit());

describe("checkRateLimit", () => {
  it("allows up to 8 messages in the window, then blocks", () => {
    for (let i = 0; i < 8; i++) {
      expect(checkRateLimit("ip-a", 1000)).toBe(true);
    }
    expect(checkRateLimit("ip-a", 1000)).toBe(false);
  });
  it("allows again after the window elapses", () => {
    for (let i = 0; i < 8; i++) checkRateLimit("ip-b", 0);
    expect(checkRateLimit("ip-b", 0)).toBe(false);
    expect(checkRateLimit("ip-b", 60_001)).toBe(true);
  });
  it("tracks keys independently", () => {
    for (let i = 0; i < 8; i++) checkRateLimit("ip-c", 0);
    expect(checkRateLimit("ip-c", 0)).toBe(false);
    expect(checkRateLimit("ip-d", 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rate-limit`
Expected: FAIL — cannot find module `./rate-limit`.

- [ ] **Step 3: Implement the limiter**

`src/lib/ai/rate-limit.ts`:
```ts
const WINDOW_MS = 60_000;
const LIMIT = 8;
const hits = new Map<string, number[]>();

/** Sliding-window limiter. Returns true if the call is allowed. */
export function checkRateLimit(key: string, now: number = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Test-only: clears all tracked keys. */
export function __resetRateLimit(): void {
  hits.clear();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rate-limit`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/lib/ai/rate-limit.ts src/lib/ai/rate-limit.test.ts
git commit -m "Add in-memory rate limiter for AI advisor"
```

---

### Task 4: Server-only Groq client

**Files:**
- Create: `src/lib/ai/groq.ts`

No unit test — thin infra wrapper, exercised through the action test (Task 5) with a mock.

- [ ] **Step 1: Implement the client**

`src/lib/ai/groq.ts`:
```ts
import "server-only";
import Groq from "groq-sdk";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

let cached: Groq | null = null;
function client(): Groq {
  if (cached) return cached;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing.");
  cached = new Groq({ apiKey });
  return cached;
}

/** Non-streaming chat completion. Returns the assistant text (may be empty). */
export async function chat(messages: ChatMsg[]): Promise<string> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const res = await client().chat.completions.create({
    model,
    messages,
    temperature: 0.5,
    max_tokens: 700,
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/ai/groq.ts
git commit -m "Add server-only Groq client"
```

---

### Task 5: `askAdvisor` server action

**Files:**
- Create: `src/app/actions/advisor.ts`, `src/app/actions/advisor.test.ts`

- [ ] **Step 1: Write the failing test**

`src/app/actions/advisor.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { chat, checkRateLimit } = vi.hoisted(() => ({
  chat: vi.fn(),
  checkRateLimit: vi.fn(() => true),
}));

vi.mock("@/lib/ai/groq", () => ({ chat }));
vi.mock("@/lib/ai/rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/ai/system-prompt", () => ({ buildSystemPrompt: () => "SYSTEM" }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => "1.2.3.4" }),
}));

import { askAdvisor } from "./advisor";
import type { AdvisorMessage } from "@/lib/ai/types";

const user = (content: string): AdvisorMessage[] => [{ role: "user", content }];

beforeEach(() => {
  chat.mockReset();
  checkRateLimit.mockReset();
  checkRateLimit.mockReturnValue(true);
});

describe("askAdvisor", () => {
  it("returns content and parsed CTA on success", async () => {
    chat.mockResolvedValue("Here you go.\nCTA: /quote | Get a quote");
    const res = await askAdvisor(user("Plan a route"));
    expect(res).toEqual({ ok: true, content: "Here you go.", cta: { href: "/quote", label: "Get a quote" } });
  });

  it("blocks when rate-limited and does not call Groq", async () => {
    checkRateLimit.mockReturnValue(false);
    const res = await askAdvisor(user("hi"));
    expect(res.ok).toBe(false);
    expect(chat).not.toHaveBeenCalled();
  });

  it("rejects empty input without calling Groq", async () => {
    const res = await askAdvisor([]);
    expect(res.ok).toBe(false);
    expect(chat).not.toHaveBeenCalled();
  });

  it("rejects an oversized message", async () => {
    const res = await askAdvisor(user("x".repeat(2001)));
    expect(res.ok).toBe(false);
    expect(chat).not.toHaveBeenCalled();
  });

  it("returns a fallback error when Groq throws", async () => {
    chat.mockRejectedValue(new Error("boom"));
    const res = await askAdvisor(user("hi"));
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- advisor`
Expected: FAIL — cannot find module `./advisor`.

- [ ] **Step 3: Implement the action**

`src/app/actions/advisor.ts`:
```ts
"use server";

import { headers } from "next/headers";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { chat } from "@/lib/ai/groq";
import { extractCta } from "@/lib/ai/cta";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import type { AdvisorMessage, AdvisorResult } from "@/lib/ai/types";

const MAX_LEN = 2000;
const MAX_HISTORY = 12;
const FALLBACK =
  "The advisor is briefly unavailable — please try again, or use the quote and tracking tools.";

export async function askAdvisor(messages: AdvisorMessage[]): Promise<AdvisorResult> {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "Please type a message." };
  }
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return { ok: false, error: "Please type a message." };
  }
  if (last.content.length > MAX_LEN) {
    return { ok: false, error: "That message is a bit long — please shorten it." };
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!checkRateLimit(ip)) {
    return { ok: false, error: "You're sending messages quickly — give it a few seconds." };
  }

  const history = messages
    .slice(-MAX_HISTORY)
    .filter((m) => m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_LEN) }));

  try {
    const reply = await chat([{ role: "system", content: buildSystemPrompt() }, ...history]);
    if (!reply) return { ok: false, error: FALLBACK };
    const { content, cta } = extractCta(reply);
    return { ok: true, content, cta };
  } catch (err) {
    console.error("[advisor] groq error:", err);
    return { ok: false, error: FALLBACK };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- advisor`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/app/actions/advisor.ts src/app/actions/advisor.test.ts
git commit -m "Add askAdvisor server action"
```

---

### Task 6: Wire the chat panel to the live advisor

**Files:**
- Modify: `src/components/ai/ai-assistant.tsx`

Replace the **entire file** with the version below. Changes from the current file: removes the mock `getResponse` and the `setTimeout`; `send` is now async and calls `askAdvisor` with the real history; the fake "thinking steps" (`Msg.steps` + the `<ul>` in `Bubble` + the `Check` import) are removed; errors render as a normal assistant bubble. The launcher, panel, quick prompts, typing indicator, voice button and CTA rendering are unchanged.

- [ ] **Step 1: Replace `src/components/ai/ai-assistant.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Send, Mic, X, ArrowRight, Bot } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { askAdvisor } from "@/app/actions/advisor";
import type { AdvisorMessage } from "@/lib/ai/types";

type Msg = {
  id: number;
  role: "user" | "assistant";
  content: string;
  cta?: { label: string; href: string };
};

const QUICK_PROMPTS = [
  "Plan an Asia→Europe shipment, lowest risk",
  "What if the Red Sea is disrupted?",
  "Recommend a warehouse near Rotterdam",
  "Get an instant quote",
];

const GREETING: Msg = {
  id: 0,
  role: "assistant",
  content:
    "Hi, I'm the BlueRoute AI Advisor. I can quote shipments, explain tracking, analyze risk, and plan multi-leg routes. What can I help with?",
};

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Allow any CTA on the site to open the advisor.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("br-open-assistant", handler);
    return () => window.removeEventListener("br-open-assistant", handler);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open]);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || thinking) return;
    const userMsg: Msg = { id: idRef.current++, role: "user", content: value };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setThinking(true);

    // Send the conversation (minus the canned greeting) to the model.
    const history: AdvisorMessage[] = next
      .filter((m) => m.id !== 0)
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await askAdvisor(history);
    setThinking(false);
    setMessages((m) => [
      ...m,
      res.ok
        ? { id: idRef.current++, role: "assistant", content: res.content, cta: res.cta }
        : { id: idRef.current++, role: "assistant", content: res.error },
    ]);
  };

  return (
    <>
      {/* Launcher */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: EASE_OUT_EXPO }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open BlueRoute AI Advisor"
        className="bg-aurora-gradient fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(110,75,255,0.6)] transition-transform hover:-translate-y-0.5 active:scale-95"
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <Sparkles className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="hidden sm:inline">AI Advisor</span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="fixed bottom-20 right-4 z-[60] flex h-[min(70vh,560px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-3xl border border-steel/70 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="bg-aurora-gradient flex items-center justify-between px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">BlueRoute AI Advisor</p>
                  <p className="flex items-center gap-1 text-[0.7rem] text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Online · agentic
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-white/90 hover:bg-white/15"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-abyss p-4">
              {messages.map((m) => (
                <Bubble key={m.id} msg={m} />
              ))}
              {thinking && <Typing />}
            </div>

            {/* Quick prompts */}
            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5 border-t border-steel/60 bg-white px-3 pt-3">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-steel/70 px-2.5 py-1 text-[0.72rem] text-mist transition-colors hover:border-cyan/40 hover:text-cyan"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 bg-white p-3"
            >
              <button
                type="button"
                aria-label="Voice input"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-steel/70 text-mist transition-colors hover:border-cyan/40 hover:text-cyan"
              >
                <Mic className="h-4.5 w-4.5" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about quotes, tracking, risk…"
                aria-label="Message the AI Advisor"
                className="h-10 flex-1 rounded-full border border-steel/70 bg-abyss px-4 text-sm text-foam placeholder:text-mist/70 outline-none focus:border-cyan/50"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!input.trim() || thinking}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan to-indigo text-white transition-transform active:scale-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-cyan to-indigo px-3.5 py-2.5 text-sm text-white"
            : "max-w-[88%] rounded-2xl rounded-bl-sm border border-steel/70 bg-white px-3.5 py-2.5 text-sm text-foam shadow-soft"
        }
      >
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        {msg.cta && (
          <Link
            href={msg.cta.href}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan"
          >
            {msg.cta.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-steel/70 bg-white px-4 py-3 shadow-soft">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck, lint, and run the suite**

Run: `npx tsc --noEmit` then `npx eslint src/components/ai/ai-assistant.tsx` then `npm test`
Expected: tsc exit 0, eslint exit 0, all tests pass (existing 19 + 14 new = 33).

- [ ] **Step 3: Commit**

```powershell
git add src/components/ai/ai-assistant.tsx
git commit -m "Wire AI assistant panel to the live Groq advisor"
```

---

### Task 7: Groq key setup + manual verification

**Files:**
- Modify: `.env.local` (Timi, guided — not committed)

- [ ] **Step 1: Guided Groq setup (Timi performs)**

1. Go to https://console.groq.com → sign in → **API Keys** → **Create API Key**, copy it.
2. Open `C:\Users\Timel\Desktop\BlueRoute\.env.local` and add:
   ```
   GROQ_API_KEY=gsk_your_key_here
   # optional override; defaults to llama-3.3-70b-versatile
   # GROQ_MODEL=llama-3.3-70b-versatile
   ```
3. Save, then restart the dev server (`npm run dev`).

- [ ] **Step 2: Manual end-to-end verification**

1. Open http://localhost:3000, click the **AI Advisor** launcher (bottom-right).
2. Ask: "What's the difference between FCL and LCL?" → expect a coherent, on-brand answer (not the old canned text).
3. Ask: "I need to ship from Shanghai to Rotterdam" → expect route guidance and likely a **Get a quote** CTA button linking to `/quote`.
4. Send 9 messages rapidly → expect the rate-limit message ("You're sending messages quickly…").
5. If you see the fallback "briefly unavailable" message, the key is missing/invalid or the model name is wrong — check `.env.local` and, if needed, set `GROQ_MODEL` to a current model from the Groq console.

- [ ] **Step 3: Final check**

Run: `npm test` and `npx tsc --noEmit` and `npm run build`
Expected: tests pass, no type errors, build succeeds.

---

## Notes for the implementer

- **Env var is runtime-only:** `npm run build` succeeds without `GROQ_API_KEY`; the advisor returns the fallback error until the key is set (Task 7). Do Tasks 1–6 freely; Task 7 needs Timi's key.
- **Vitest mock gotcha:** mock functions referenced inside `vi.mock` factories must be created via `vi.hoisted()` (the factory is hoisted above module scope) — the Task 5 test already does this.
- The header still reads "Online · agentic" — acceptable; true agentic tool-calling is a later sub-project.
