"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatTrackingNumber } from "@/lib/admin/tracking-number";
import { validateShipmentInput } from "@/lib/admin/shipment-validate";

export type ShipmentActionResult = {
  ok: boolean;
  id?: string;
  trackingNumber?: string;
  errors?: Record<string, string>;
  error?: string;
};

function formToRaw(form: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") raw[key] = value;
  });
  return raw;
}

/** Uploads the optional photo; returns its public URL or null. Best-effort. */
async function uploadPhoto(form: FormData, shipmentId: string): Promise<string | null> {
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) return null; // 5 MB cap
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${shipmentId}.${ext || "jpg"}`;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from("shipment-photos")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) {
    console.error("[shipments] photo upload failed:", error.message);
    return null;
  }
  return supabase.storage.from("shipment-photos").getPublicUrl(path).data.publicUrl;
}

export async function createShipment(form: FormData): Promise<ShipmentActionResult> {
  await requireAdmin("create");
  const parsed = validateShipmentInput(formToRaw(form));
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const trackingNumber = formatTrackingNumber(crypto.randomUUID());
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shipments")
    .insert({ ...parsed.data, tracking_number: trackingNumber })
    .select("id")
    .single();
  if (error) {
    console.error("[shipments] create failed:", error.message);
    return { ok: false, error: "Could not save the shipment. Try again." };
  }

  const photoUrl = await uploadPhoto(form, data.id);
  if (photoUrl) {
    await supabase.from("shipments").update({ photo_url: photoUrl }).eq("id", data.id);
  }

  // Initial tracking-log entry.
  await supabase.from("shipment_events").insert({
    shipment_id: data.id,
    status: parsed.data.status,
    location: parsed.data.current_location ?? parsed.data.origin,
    country: parsed.data.sender_country,
    comment: "Shipment created",
    occurred_at: parsed.data.date_shipped
      ? new Date(`${parsed.data.date_shipped}T12:00:00Z`).toISOString()
      : new Date().toISOString(),
  });

  revalidatePath("/admin/shipments");
  return { ok: true, id: data.id, trackingNumber };
}

export async function updateShipment(id: string, form: FormData): Promise<ShipmentActionResult> {
  await requireAdmin("shipments");
  const parsed = validateShipmentInput(formToRaw(form));
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const supabase = getSupabaseAdmin();
  const photoUrl = await uploadPhoto(form, id);
  const { error } = await supabase
    .from("shipments")
    .update({ ...parsed.data, ...(photoUrl ? { photo_url: photoUrl } : {}) })
    .eq("id", id);
  if (error) {
    console.error("[shipments] update failed:", error.message);
    return { ok: false, error: "Could not update the shipment." };
  }
  revalidatePath("/admin/shipments");
  revalidatePath(`/admin/shipments/${id}`);
  return { ok: true, id };
}

export type ShipmentEventInput = {
  status: string;
  location: string;
  country?: string;
  comment?: string;
  /** datetime-local value; a past datetime backdates the entry. */
  occurredAt: string;
};

function parseOccurredAt(value: string): string | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** After any event change, sync the parent's status/current location to the latest event. */
async function syncShipmentToLatestEvent(shipmentId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("shipment_events")
    .select("status, location")
    .eq("shipment_id", shipmentId)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) {
    await supabase
      .from("shipments")
      .update({ status: data.status, current_location: data.location })
      .eq("id", shipmentId);
  }
}

export async function addShipmentEvent(
  shipmentId: string,
  e: ShipmentEventInput,
): Promise<ShipmentActionResult> {
  await requireAdmin("shipments");
  if (!e.status.trim() || !e.location.trim())
    return { ok: false, error: "Status and location are required." };
  const occurred = parseOccurredAt(e.occurredAt);
  if (!occurred) return { ok: false, error: "Invalid date/time." };

  const { error } = await getSupabaseAdmin().from("shipment_events").insert({
    shipment_id: shipmentId,
    status: e.status.trim(),
    location: e.location.trim(),
    country: e.country?.trim() || null,
    comment: e.comment?.trim() || null,
    occurred_at: occurred,
  });
  if (error) {
    console.error("[shipments] add event failed:", error.message);
    return { ok: false, error: "Could not add the log entry." };
  }
  await syncShipmentToLatestEvent(shipmentId);
  revalidatePath(`/admin/shipments/${shipmentId}`);
  return { ok: true };
}

export type ShipmentUpdateInput = {
  /** New location address — becomes the log entry's location AND the shipment's current location. */
  location: string;
  city?: string;
  country?: string;
  status: string;
  deliveryPct?: string;
  comment?: string;
};

/**
 * The "Update shipment status" modal (mockup flow): one call adds a tracking-log
 * entry (occurred_at = now) and moves the shipment itself forward.
 */
export async function addShipmentUpdate(
  shipmentId: string,
  u: ShipmentUpdateInput,
): Promise<ShipmentActionResult> {
  await requireAdmin("shipments");
  if (!u.location.trim() || !u.status.trim())
    return { ok: false, error: "New location and status are required." };
  let deliveryPct: number | null = null;
  if (u.deliveryPct && u.deliveryPct.trim() !== "") {
    deliveryPct = Number(u.deliveryPct);
    if (!Number.isInteger(deliveryPct) || deliveryPct < 0 || deliveryPct > 100)
      return { ok: false, error: "Delivery % must be a whole number 0–100." };
  }

  const supabase = getSupabaseAdmin();
  const { error: evError } = await supabase.from("shipment_events").insert({
    shipment_id: shipmentId,
    status: u.status.trim(),
    location: u.location.trim(),
    country: u.country?.trim() || null,
    comment: u.comment?.trim() || null,
    occurred_at: new Date().toISOString(),
  });
  if (evError) {
    console.error("[shipments] add update failed:", evError.message);
    return { ok: false, error: "Could not save the update." };
  }

  const { error: shError } = await supabase
    .from("shipments")
    .update({
      status: u.status.trim(),
      current_location: u.location.trim(),
      ...(u.city?.trim() ? { current_city: u.city.trim() } : {}),
      ...(deliveryPct !== null ? { delivery_pct: deliveryPct } : {}),
    })
    .eq("id", shipmentId);
  if (shError) {
    console.error("[shipments] update after event failed:", shError.message);
    return { ok: false, error: "Update logged, but the shipment did not refresh." };
  }

  revalidatePath("/admin/shipments");
  revalidatePath(`/admin/shipments/${shipmentId}`);
  return { ok: true };
}

export async function updateShipmentEvent(
  id: string,
  shipmentId: string,
  e: ShipmentEventInput,
): Promise<ShipmentActionResult> {
  await requireAdmin("shipments");
  if (!e.status.trim() || !e.location.trim())
    return { ok: false, error: "Status and location are required." };
  const occurred = parseOccurredAt(e.occurredAt);
  if (!occurred) return { ok: false, error: "Invalid date/time." };

  const { error } = await getSupabaseAdmin()
    .from("shipment_events")
    .update({
      status: e.status.trim(),
      location: e.location.trim(),
      country: e.country?.trim() || null,
      comment: e.comment?.trim() || null,
      occurred_at: occurred,
    })
    .eq("id", id);
  if (error) {
    console.error("[shipments] update event failed:", error.message);
    return { ok: false, error: "Could not update the log entry." };
  }
  await syncShipmentToLatestEvent(shipmentId);
  revalidatePath(`/admin/shipments/${shipmentId}`);
  return { ok: true };
}

export async function deleteShipmentEvent(
  id: string,
  shipmentId: string,
): Promise<ShipmentActionResult> {
  await requireAdmin("shipments");
  const { error } = await getSupabaseAdmin().from("shipment_events").delete().eq("id", id);
  if (error) {
    console.error("[shipments] delete event failed:", error.message);
    return { ok: false, error: "Could not delete the log entry." };
  }
  await syncShipmentToLatestEvent(shipmentId);
  revalidatePath(`/admin/shipments/${shipmentId}`);
  return { ok: true };
}
