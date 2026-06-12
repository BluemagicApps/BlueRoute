import type { Metadata } from "next";
import { TrackingExperience } from "@/components/tracking/tracking-experience";

export const metadata: Metadata = {
  title: "Live Tracking",
  description:
    "Track any shipment in real time — live vessel position, AI-predicted ETAs, IoT telemetry, documents, and proactive exception management.",
};

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return <TrackingExperience initialRef={ref} />;
}
