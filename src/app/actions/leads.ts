"use server";

import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmails } from "@/lib/email/resend";
import { validateContact, validateBooking } from "@/lib/leads/validate";
import { resolveBooking } from "@/lib/leads/booking";
import { formatTicketRef, formatBookingRef } from "@/lib/leads/refs";
import {
  contactTeamEmail,
  contactAckEmail,
  bookingTeamEmail,
  bookingAckEmail,
} from "@/lib/email/templates";
import type {
  ContactInput,
  ContactState,
  BookingInput,
  BookingState,
} from "@/lib/leads/types";

const HONEYPOT = "company_url";
const GENERIC = "Something went wrong — please try again or email us directly.";
const team = () => process.env.LEAD_NOTIFICATION_EMAIL ?? "";
const str = (fd: FormData, k: string) => ((fd.get(k) as string) ?? "").trim();

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot: pretend success, store nothing.
  if (str(formData, HONEYPOT)) {
    return { status: "success", ticketRef: formatTicketRef(crypto.randomUUID()) };
  }

  const input: ContactInput = {
    name: str(formData, "name"),
    company: str(formData, "company"),
    email: str(formData, "email"),
    topic: str(formData, "topic"),
    message: str(formData, "message"),
  };

  const fieldErrors = validateContact(input);
  if (Object.keys(fieldErrors).length) {
    return { status: "error", error: "Please fix the fields below.", fieldErrors };
  }

  const ticketRef = formatTicketRef(crypto.randomUUID());
  const userAgent = (await headers()).get("user-agent") ?? null;

  try {
    const { error } = await getSupabaseAdmin().from("contact_inquiries").insert({
      name: input.name,
      company: input.company || null,
      email: input.email,
      topic: input.topic || null,
      message: input.message,
      ticket_ref: ticketRef,
      user_agent: userAgent,
    });
    if (error) {
      console.error("[contact] insert failed:", error);
      return { status: "error", error: GENERIC };
    }
  } catch (err) {
    console.error("[contact] insert threw:", err);
    return { status: "error", error: GENERIC };
  }

  await sendEmails([
    { to: team(), replyTo: input.email, ...contactTeamEmail(input, ticketRef) },
    { to: input.email, ...contactAckEmail(input, ticketRef) },
  ]);

  return { status: "success", ticketRef };
}

export async function submitBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  if (str(formData, HONEYPOT)) {
    return {
      status: "success",
      bookingRef: formatBookingRef(
        crypto.randomUUID(),
        str(formData, "originCode"),
        str(formData, "destCode"),
      ),
    };
  }

  const input: BookingInput = {
    name: str(formData, "name"),
    email: str(formData, "email"),
    company: str(formData, "company"),
    originCode: str(formData, "originCode"),
    destCode: str(formData, "destCode"),
    mode: str(formData, "mode") === "port-to-port" ? "port-to-port" : "door-to-door",
    containerId: str(formData, "containerId"),
    optionId: (str(formData, "optionId") || "balanced") as BookingInput["optionId"],
    insurance: str(formData, "insurance") === "true",
    weightKg: Number(str(formData, "weight")) || null,
    readyDate: str(formData, "readyDate") || null,
  };

  const fieldErrors = validateBooking(input);
  if (Object.keys(fieldErrors).length) {
    return { status: "error", error: "Please fix the fields below.", fieldErrors };
  }

  const resolved = resolveBooking(input);
  if (!resolved) {
    return { status: "error", error: "We couldn't price that route — please review your selection." };
  }

  const bookingRef = formatBookingRef(
    crypto.randomUUID(),
    resolved.origin.code,
    resolved.destination.code,
  );

  try {
    const { error } = await getSupabaseAdmin().from("quote_requests").insert({
      name: input.name,
      email: input.email,
      company: input.company || null,
      origin_code: resolved.origin.code,
      origin_label: resolved.origin.label,
      dest_code: resolved.destination.code,
      dest_label: resolved.destination.label,
      mode: resolved.mode,
      container_id: resolved.container.id,
      container_label: resolved.container.label,
      weight_kg: input.weightKg,
      ready_date: input.readyDate,
      option_id: resolved.option.id,
      option_name: resolved.option.name,
      transit_days: resolved.option.transitDays,
      co2_kg: resolved.option.co2Kg,
      price_usd: resolved.option.priceUSD,
      insurance: resolved.insurance,
      insurance_fee_usd: resolved.insuranceFeeUSD,
      total_usd: resolved.totalUSD,
      booking_ref: bookingRef,
    });
    if (error) {
      console.error("[booking] insert failed:", error);
      return { status: "error", error: GENERIC };
    }
  } catch (err) {
    console.error("[booking] insert threw:", err);
    return { status: "error", error: GENERIC };
  }

  const person = { name: input.name, email: input.email };
  await sendEmails([
    { to: team(), replyTo: input.email, ...bookingTeamEmail(person, resolved, bookingRef) },
    { to: input.email, ...bookingAckEmail(person, resolved, bookingRef) },
  ]);

  return { status: "success", bookingRef };
}
