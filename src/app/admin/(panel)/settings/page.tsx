import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "App Settings" };
export const dynamic = "force-dynamic";

/** Current live site values, shown until an override is saved. */
const DEFAULTS: Record<string, string> = {
  site_name: "Blue Route Logistics",
  site_tagline: "Intelligent Global Shipping",
  contact_phone: "+1 (323) 484-8030",
  sales_email: "sales@blueroute.com",
  support_email: "support@blueroute.com",
  hq_address: "3229 Hadley St, Houston, TX 77004",
};

export default async function AdminSettingsPage() {
  await requireAdmin("settings");
  const { data } = await getSupabaseAdmin().from("app_settings").select("key, value");
  const values = { ...DEFAULTS };
  for (const row of data ?? []) {
    if (row.key in values) values[row.key] = row.value;
  }

  return (
    <div>
      <h1
        className="text-2xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        App settings
      </h1>
      <p className="mt-1 text-sm text-mist">
        Site information used across the website and emails.
      </p>
      <div className="mt-6 max-w-2xl">
        <SettingsForm values={values} />
      </div>
    </div>
  );
}
