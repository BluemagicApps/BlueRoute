"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Editable site-info keys (admin manages the values; site wiring is a later pass). */
const SETTING_KEYS = [
  "site_name",
  "site_tagline",
  "contact_phone",
  "sales_email",
  "support_email",
  "hq_address",
] as const;

export async function saveSettings(
  entries: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin("settings");
  const rows = SETTING_KEYS.filter((k) => k in entries).map((key) => ({
    key,
    value: entries[key].trim(),
    updated_at: new Date().toISOString(),
  }));
  if (rows.length === 0) return { ok: false, error: "Nothing to save." };

  const { error } = await getSupabaseAdmin().from("app_settings").upsert(rows);
  if (error) {
    console.error("[settings] save failed:", error.message);
    return { ok: false, error: "Could not save settings." };
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}
