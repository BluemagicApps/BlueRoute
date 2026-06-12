import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "AI Audit" };
export const dynamic = "force-dynamic";

type Interaction = {
  id: string;
  created_at: string;
  question: string;
  answer: string | null;
  cta_path: string | null;
  model: string | null;
  duration_ms: number | null;
  ok: boolean;
};

async function loadAudit() {
  const supabase = getSupabaseAdmin();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  return Promise.all([
    supabase.from("ai_interactions").select("id", { count: "exact", head: true }),
    supabase
      .from("ai_interactions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    supabase
      .from("ai_interactions")
      .select("id", { count: "exact", head: true })
      .eq("ok", false),
    supabase
      .from("ai_interactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
}

export default async function AiAuditPage() {
  await requireAdmin("ai-audit");
  const [totalRes, weekRes, errorRes, latestRes] = await loadAudit();

  const kpis = [
    { label: "Total conversations", value: totalRes.count ?? 0, color: "text-foam" },
    { label: "Last 7 days", value: weekRes.count ?? 0, color: "text-cyan" },
    { label: "Errors", value: errorRes.count ?? 0, color: "text-rose" },
  ];
  const rows = (latestRes.data ?? []) as Interaction[];

  return (
    <div>
      <h1
        className="text-2xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        AI audit
      </h1>
      <p className="mt-1 text-sm text-mist">
        Every AI Advisor conversation is logged here for analytics and auditing.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-3xl border border-steel/70 bg-deep p-5 shadow-soft">
            <p className="text-sm text-mist">{k.label}</p>
            <p className={cn("mt-1 text-3xl font-semibold", k.color)} style={{ fontFamily: "var(--font-display)" }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {rows.length === 0 && (
          <p className="rounded-3xl border border-steel/70 bg-deep p-8 text-center text-sm text-mist shadow-soft">
            No AI interactions logged yet — they appear as soon as visitors use
            the AI Advisor.
          </p>
        )}
        {rows.map((r) => (
          <details key={r.id} className="rounded-3xl border border-steel/70 bg-deep p-5 shadow-soft">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", r.ok ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose")}>
                {r.ok ? "OK" : "Error"}
              </span>
              <span className="flex-1 truncate font-medium text-foam">{r.question}</span>
              <span className="text-xs text-mist">
                {new Date(r.created_at).toLocaleString()} ·{" "}
                {r.duration_ms != null ? `${(r.duration_ms / 1000).toFixed(1)}s` : "—"}
              </span>
            </summary>
            <div className="mt-4 space-y-2 border-t border-steel/50 pt-4 text-sm">
              <p className="text-mist">
                <span className="font-semibold text-foam">Question:</span> {r.question}
              </p>
              <p className="whitespace-pre-wrap text-mist">
                <span className="font-semibold text-foam">Answer:</span>{" "}
                {r.answer ?? "(no answer — request failed)"}
              </p>
              <p className="text-xs text-mist">
                Model: {r.model ?? "—"}
                {r.cta_path ? ` · Suggested CTA: ${r.cta_path}` : ""}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
