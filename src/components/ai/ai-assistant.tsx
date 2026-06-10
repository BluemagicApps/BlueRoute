"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Send,
  Mic,
  X,
  Check,
  ArrowRight,
  Bot,
} from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";

type Msg = {
  id: number;
  role: "user" | "assistant";
  content: string;
  steps?: string[];
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

/** Rule-based mock of an agentic logistics assistant. */
function getResponse(text: string): Omit<Msg, "id" | "role"> {
  const t = text.toLowerCase();

  if (/(plan|optimi|lowest risk|route|asia|europe)/.test(t)) {
    return {
      steps: [
        "Analyzing 14 candidate routings across 3 alliances",
        "Scoring weather, port congestion & geopolitical risk",
        "Optimizing cost vs. transit vs. emissions",
      ],
      content:
        "Recommended: Shanghai → Singapore → Suez → Rotterdam on the ANE service. 28-day transit, 99% on-time confidence, and 26% lower emissions than the express alternative. I've flagged a congestion-avoiding backup lane in case Suez slows.",
      cta: { label: "Get this quote", href: "/quote" },
    };
  }
  if (/(red sea|suez|disrupt|risk|war|strike|delay)/.test(t)) {
    return {
      steps: [
        "Checking live disruption signals on your lanes",
        "Simulating Cape of Good Hope reroute",
      ],
      content:
        "If the Red Sea is disrupted, I'd reroute via the Cape of Good Hope: +9 days transit but risk drops to 'very low'. For time-critical cargo I'd split the shipment and air-expedite the priority SKUs. Want me to model the cost difference?",
      cta: { label: "Open risk dashboard", href: "/tracking" },
    };
  }
  if (/(warehouse|storage|space|lease|facility)/.test(t)) {
    return {
      content:
        "Near Rotterdam, my top match is Rotterdam Smart Hub A — 84,000 ft², 12 m clear height, 18 docks, solar + automated racking, available now at $11.50/ft²/yr. It pairs well with the ANE ocean service for fast inbound.",
      cta: { label: "Explore facilities", href: "/warehousing" },
    };
  }
  if (/(quote|price|rate|cost|book)/.test(t)) {
    return {
      content:
        "I can generate an AI-optimized quote in seconds — I'll compare express, balanced, and low-carbon routes with live rates and a carbon estimate. Just tell me origin, destination, and container type, or open the quote wizard.",
      cta: { label: "Start a quote", href: "/quote" },
    };
  }
  if (/(track|where|container|shipment|eta)/.test(t)) {
    return {
      content:
        "Share a container #, B/L, or booking reference and I'll pull the live position, predicted ETA with confidence, and any active exceptions. I proactively flag risks before they become delays.",
      cta: { label: "Track a shipment", href: "/tracking" },
    };
  }
  if (/(hi|hello|hey|help)/.test(t)) {
    return {
      content:
        "Happy to help! I can quote, track, analyze risk, plan routes, or recommend warehouse space. Try one of the suggestions below.",
    };
  }
  return {
    content:
      "I can help with quotes, tracking, risk analysis, route planning, and warehouse matching. Could you give me a bit more detail — e.g. origin/destination, a container number, or what you're optimizing for?",
  };
}

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

  const send = (text: string) => {
    const value = text.trim();
    if (!value || thinking) return;
    const userMsg: Msg = { id: idRef.current++, role: "user", content: value };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    const res = getResponse(value);
    const delay = 700 + (res.steps ? res.steps.length * 450 : 0);
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: idRef.current++, role: "assistant", ...res }]);
      setThinking(false);
    }, delay);
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
        {msg.steps && (
          <ul className="mb-2 space-y-1 border-b border-steel/50 pb-2">
            {msg.steps.map((s) => (
              <li key={s} className="flex items-start gap-1.5 text-[0.78rem] text-mist">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" /> {s}
              </li>
            ))}
          </ul>
        )}
        <p className="leading-relaxed">{msg.content}</p>
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
