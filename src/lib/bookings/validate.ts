// Hand-rolled validation in the style of src/lib/leads/validate.ts — no zod.

export type WarehouseBookingInput = {
  facilityId: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  sqftRequested: number;
  moveIn: string;
  termMonths: number;
  features: string[];
  message: string;
};

export type BookingFieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateWarehouseBooking(input: WarehouseBookingInput): BookingFieldErrors {
  const e: BookingFieldErrors = {};
  if (!input.facilityId.trim()) e.facilityId = "Choose a facility.";
  if (!input.name.trim()) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(input.email)) e.email = "Enter a valid email.";
  if (!Number.isFinite(input.sqftRequested) || input.sqftRequested <= 0)
    e.sqftRequested = "Enter the space you need (ft²).";
  if (!Number.isInteger(input.termMonths) || input.termMonths <= 0)
    e.termMonths = "Enter a lease term in months.";
  if (!input.moveIn.trim()) e.moveIn = "Choose a move-in date.";
  return e;
}

/** Pure assembler for the bookings.details jsonb payload. */
export function buildBookingDetails(
  input: WarehouseBookingInput,
  facility: { name: string; city: string; country: string },
): Record<string, unknown> {
  return {
    facilityName: facility.name,
    city: facility.city,
    country: facility.country,
    sqftRequested: input.sqftRequested,
    moveIn: input.moveIn,
    termMonths: input.termMonths,
    features: input.features,
    message: input.message,
  };
}
