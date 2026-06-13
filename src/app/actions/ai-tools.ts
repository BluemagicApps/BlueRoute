"use server";

import { headers } from "next/headers";
import { PORTS, CONTAINERS, estimateDistanceKm, computeQuotes } from "@/lib/quote-data";
import { chatJSON } from "@/lib/ai/groq";
import { fetchWeather } from "@/lib/ai/weather";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildPredictivePrompt,
  normalizePredictive,
  type PredictiveResult,
} from "@/lib/ai/tools/predictive";
import {
  buildOptimizerPrompt,
  normalizeOptimizer,
  type OptimizerResult,
  type RouteCandidate,
} from "@/lib/ai/tools/optimizer";
import {
  buildResolutionPrompt,
  normalizeResolution,
  type ResolutionResult,
} from "@/lib/ai/tools/resolution";

export type ToolState<T> =
  | { status: "idle" }
  | { status: "success"; result: T; weatherUsed: boolean }
  | { status: "error"; error: string };

const RATE_MSG = "You're running tools quickly — give it a few seconds.";
const GEN_ERR = "Couldn't generate an analysis — please try again.";
const str = (fd: FormData, k: string) => ((fd.get(k) as string) ?? "").trim();

async function rateOk(): Promise<boolean> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return checkRateLimit(ip);
}

/** Best-effort audit log — must never break a tool. */
async function logTool(label: string, summary: string, durationMs: number, ok: boolean): Promise<void> {
  try {
    await getSupabaseAdmin().from("ai_interactions").insert({
      question: label,
      answer: ok ? summary : null,
      cta_path: null,
      duration_ms: durationMs,
      ok,
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    });
  } catch (err) {
    console.error("[ai-tools] audit log failed:", err);
  }
}

function resolveLane(fd: FormData): { origin: (typeof PORTS)[number]; destination: (typeof PORTS)[number] } | null {
  const origin = PORTS.find((p) => p.code === str(fd, "originCode"));
  const destination = PORTS.find((p) => p.code === str(fd, "destCode"));
  if (!origin || !destination || origin.code === destination.code) return null;
  return { origin, destination };
}

export async function runPredictiveInsights(
  _prev: ToolState<PredictiveResult>,
  formData: FormData,
): Promise<ToolState<PredictiveResult>> {
  if (!(await rateOk())) return { status: "error", error: RATE_MSG };
  const lane = resolveLane(formData);
  if (!lane) return { status: "error", error: "Choose two different ports." };
  const { origin, destination } = lane;
  const readyDate = str(formData, "readyDate") || undefined;
  const container = CONTAINERS.find((c) => c.id === "40hc") ?? CONTAINERS[0];
  const distanceKm = Math.round(estimateDistanceKm({ origin, destination, container, mode: "port-to-port" }));

  const started = Date.now();
  const label = `predictive-insights: ${origin.code}->${destination.code}`;
  try {
    const [originWx, destWx] = await Promise.all([fetchWeather(origin.lat, origin.lng), fetchWeather(destination.lat, destination.lng)]);
    const raw = await chatJSON<unknown>(buildPredictivePrompt({ origin, destination, distanceKm, readyDate, originWx, destWx }));
    const result = normalizePredictive(raw);
    if (!result) {
      await logTool(label, "", Date.now() - started, false);
      return { status: "error", error: GEN_ERR };
    }
    await logTool(label, result.summary, Date.now() - started, true);
    return { status: "success", result, weatherUsed: !!originWx && !!destWx };
  } catch (err) {
    console.error("[ai-tools] predictive-insights failed:", err);
    await logTool(label, "", Date.now() - started, false);
    return { status: "error", error: GEN_ERR };
  }
}

export async function runRouteOptimizer(
  _prev: ToolState<OptimizerResult>,
  formData: FormData,
): Promise<ToolState<OptimizerResult>> {
  if (!(await rateOk())) return { status: "error", error: RATE_MSG };
  const lane = resolveLane(formData);
  if (!lane) return { status: "error", error: "Choose two different ports." };
  const { origin, destination } = lane;
  const container = CONTAINERS.find((c) => c.id === "40hc") ?? CONTAINERS[0];
  const candidates: RouteCandidate[] = computeQuotes({ origin, destination, container, mode: "port-to-port" }).map((q) => ({
    name: q.name,
    costUSD: q.priceUSD,
    transitDays: q.transitDays,
    co2Kg: q.co2Kg,
  }));

  const started = Date.now();
  const label = `route-optimizer: ${origin.code}->${destination.code}`;
  try {
    const [originWx, destWx] = await Promise.all([fetchWeather(origin.lat, origin.lng), fetchWeather(destination.lat, destination.lng)]);
    const raw = await chatJSON<unknown>(buildOptimizerPrompt({ origin, destination, candidates, originWx, destWx }));
    const result = normalizeOptimizer(raw);
    if (!result) {
      await logTool(label, "", Date.now() - started, false);
      return { status: "error", error: GEN_ERR };
    }
    await logTool(label, result.rationale, Date.now() - started, true);
    return { status: "success", result, weatherUsed: !!originWx && !!destWx };
  } catch (err) {
    console.error("[ai-tools] route-optimizer failed:", err);
    await logTool(label, "", Date.now() - started, false);
    return { status: "error", error: GEN_ERR };
  }
}

export async function runProactiveResolution(
  _prev: ToolState<ResolutionResult>,
  formData: FormData,
): Promise<ToolState<ResolutionResult>> {
  if (!(await rateOk())) return { status: "error", error: RATE_MSG };
  const lane = resolveLane(formData);
  if (!lane) return { status: "error", error: "Choose two different ports." };
  const { origin, destination } = lane;
  const disruption = str(formData, "disruption") || "Port congestion";
  const container = CONTAINERS.find((c) => c.id === "40hc") ?? CONTAINERS[0];
  const distanceKm = Math.round(estimateDistanceKm({ origin, destination, container, mode: "port-to-port" }));

  const started = Date.now();
  const label = `proactive-resolution: ${origin.code}->${destination.code} (${disruption})`;
  try {
    const destWx = await fetchWeather(destination.lat, destination.lng);
    const raw = await chatJSON<unknown>(buildResolutionPrompt({ origin, destination, distanceKm, disruption, destWx }));
    const result = normalizeResolution(raw);
    if (!result) {
      await logTool(label, "", Date.now() - started, false);
      return { status: "error", error: GEN_ERR };
    }
    await logTool(label, result.recommendedFix, Date.now() - started, true);
    return { status: "success", result, weatherUsed: !!destWx };
  } catch (err) {
    console.error("[ai-tools] proactive-resolution failed:", err);
    await logTool(label, "", Date.now() - started, false);
    return { status: "error", error: GEN_ERR };
  }
}
