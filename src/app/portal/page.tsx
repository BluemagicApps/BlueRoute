import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PortalDashboard } from "@/components/portal/portal-dashboard";

export const metadata: Metadata = {
  title: "Customer Portal",
  description:
    "Your Blue Route dashboard — shipments, predictive ETAs, invoices, warehouse inventory, and AI insights in one place.",
};

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <PortalDashboard userEmail={user.email ?? null} />;
}
