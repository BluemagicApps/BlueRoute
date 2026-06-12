"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { sendEmails } from "@/lib/email/resend";
import { FACILITIES } from "@/lib/warehouse-data";
import {
  validateWarehouseBooking,
  buildBookingDetails,
  type WarehouseBookingInput,
} from "@/lib/bookings/validate";
import { formatWarehouseRef } from "@/lib/bookings/refs";
import {
  warehouseBookingTeamEmail,
  warehouseBookingAckEmail,
  warehouseDecisionEmail,
} from "@/lib/email/booking-templates";

const HONEYPOT = "company_url";
const GENERIC = "Something went wrong — please try again or email us directly.";
const team = () => process.env.LEAD_NOTIFICATION_EMAIL ?? "";
const str = (fd: FormData, k: string) => ((fd.get(k) as string) ?? "").trim();
const num = (fd: FormData, k: string) => Number(str(fd, k));

export type WarehouseBookingState =
  | { status: "idle" }
  | { status: "success"; bookingRef: string }
  | { status: "error"; error: string; fieldErrors?: Record<string, string> };

export async function submitWarehouseBooking(
  _prev: WarehouseBookingState,
  formData: FormData,
): Promise<WarehouseBookingState> {
  if (str(formData, HONEYPOT)) {
    return { status: "success", bookingRef: formatWarehouseRef(crypto.randomUUID()) };
  }

  const input: WarehouseBookingInput = {
    facilityId: str(formData, "facilityId"),
    name: str(formData, "name"),
    email: str(formData, "email"),
    company: str(formData, "company"),
    phone: str(formData, "phone"),
    sqftRequested: num(formData, "sqftRequested"),
    moveIn: str(formData, "moveIn"),
    termMonths: num(formData, "termMonths"),
    features: formData.getAll("features").map((v) => String(v)),
    message: str(formData, "message"),
  };

  const fieldErrors = validateWarehouseBooking(input);
  if (Object.keys(fieldErrors).length) {
    return { status: "error", error: "Please fix the fields below.", fieldErrors };
  }

  // Resolve the facility server-side (don't trust client labels).
  const facility = FACILITIES.find((f) => f.id === input.facilityId);
  if (!facility) {
    return { status: "error", error: "That facility is no longer available." };
  }

  const bookingRef = formatWarehouseRef(crypto.randomUUID());

  try {
    const { error } = await getSupabaseAdmin().from("bookings").insert({
      type: "warehouse",
      warehouse_id: facility.id,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company: input.company || null,
      details: buildBookingDetails(input, facility),
      status: "new",
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

  await sendEmails([
    { to: team(), replyTo: input.email, ...warehouseBookingTeamEmail(input, facility, bookingRef) },
    { to: input.email, ...warehouseBookingAckEmail(input, facility, bookingRef) },
  ]);

  return { status: "success", bookingRef };
}

export async function setBookingStatus(
  id: string,
  status: "approved" | "rejected" | "closed",
): Promise<{ ok: boolean }> {
  await requireAdmin("bookings");
  if (!["approved", "rejected", "closed"].includes(status)) return { ok: false };

  const supabase = getSupabaseAdmin();
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("name, email, booking_ref, details")
    .single();
  if (error || !booking) {
    console.error("[booking] status update failed:", error?.message);
    return { ok: false };
  }

  if (status === "approved" || status === "rejected") {
    await sendEmails([
      {
        to: booking.email,
        ...warehouseDecisionEmail(
          { name: booking.name, booking_ref: booking.booking_ref, details: booking.details ?? {} },
          status,
        ),
      },
    ]);
  }

  revalidatePath("/admin/bookings");
  return { ok: true };
}
