import {
  PORTS,
  CONTAINERS,
  computeQuotes,
  computeInsuranceFee,
  type QuoteOption,
} from "@/lib/quote-data";
import type { BookingInput } from "./types";

export type ResolvedBooking = {
  origin: { code: string; label: string };
  destination: { code: string; label: string };
  container: { id: string; label: string };
  mode: BookingInput["mode"];
  option: QuoteOption;
  insurance: boolean;
  insuranceFeeUSD: number;
  totalUSD: number;
};

/**
 * Recompute the booking server-side from submitted codes so prices can't be
 * tampered with on the client. Returns null if any code is unknown.
 */
export function resolveBooking(input: BookingInput): ResolvedBooking | null {
  const origin = PORTS.find((p) => p.code === input.originCode);
  const destination = PORTS.find((p) => p.code === input.destCode);
  const container = CONTAINERS.find((c) => c.id === input.containerId);
  if (!origin || !destination || !container) return null;

  const quotes = computeQuotes({ origin, destination, container, mode: input.mode });
  const option = quotes.find((q) => q.id === input.optionId);
  if (!option) return null;

  const insuranceFeeUSD = computeInsuranceFee(option.priceUSD);
  const totalUSD = option.priceUSD + (input.insurance ? insuranceFeeUSD : 0);

  return {
    origin: { code: origin.code, label: `${origin.city}, ${origin.country}` },
    destination: { code: destination.code, label: `${destination.city}, ${destination.country}` },
    container: { id: container.id, label: container.label },
    mode: input.mode,
    option,
    insurance: input.insurance,
    insuranceFeeUSD,
    totalUSD,
  };
}
