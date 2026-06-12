import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildTrackPayload } from "@/lib/tracking/payload";
import { checkRateLimit } from "@/lib/ai/rate-limit";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/track/[number]">,
) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!checkRateLimit(`track:${ip}`, Date.now(), 20)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  const { number } = await ctx.params;
  const trackingNumber = decodeURIComponent(number).trim();
  if (!trackingNumber || trackingNumber.length > 40) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: shipment, error } = await supabase
    .from("shipments")
    .select("*")
    .ilike("tracking_number", trackingNumber) // no wildcards => case-insensitive exact
    .maybeSingle();
  if (error || !shipment) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const { data: events } = await supabase
    .from("shipment_events")
    .select("occurred_at,status,location,country,comment")
    .eq("shipment_id", shipment.id)
    .order("occurred_at", { ascending: false });

  return Response.json(buildTrackPayload(shipment, events ?? []));
}
