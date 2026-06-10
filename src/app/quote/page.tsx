import type { Metadata } from "next";
import { QuoteWizard } from "@/components/quote/quote-wizard";

export const metadata: Metadata = {
  title: "Get a Quote",
  description:
    "Get an AI-optimized shipping quote in seconds — compare express, balanced, and low-carbon routes with carbon estimates and instant booking.",
};

export default function QuotePage() {
  return <QuoteWizard />;
}
