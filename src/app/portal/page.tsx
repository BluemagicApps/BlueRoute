import type { Metadata } from "next";
import { PortalDashboard } from "@/components/portal/portal-dashboard";

export const metadata: Metadata = {
  title: "Customer Portal",
  description:
    "Your Blue Route dashboard — shipments, predictive ETAs, invoices, warehouse inventory, and AI insights in one place.",
};

export default function PortalPage() {
  return <PortalDashboard />;
}
