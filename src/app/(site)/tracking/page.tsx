import type { Metadata } from "next";
import { TrackingExperience } from "@/components/tracking/tracking-experience";

export const metadata: Metadata = {
  title: "Track Your Shipment",
  description:
    "Enter your Blue Route tracking number to see your consignment's live route, current status, and full tracking log.",
};

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return <TrackingExperience initialRef={ref} />;
}
