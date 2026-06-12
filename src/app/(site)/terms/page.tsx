import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <PagePlaceholder
      eyebrow="Legal"
      title="Terms of Service"
      description="Our terms of service are being finalized. Questions in the meantime? Reach legal@blueroute.example.com."
    />
  );
}
