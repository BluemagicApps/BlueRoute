import type { EmailBody } from "@/lib/email/templates";
import type { WarehouseBookingInput } from "@/lib/bookings/validate";
import type { ServiceQuoteConfig } from "@/lib/quote/service-fields";
import type { ServiceQuoteInput } from "@/lib/quote/validate";

type Facility = { name: string; city: string; country: string };
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

function wrap(title: string, inner: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0b1b2b">
  <div style="background:linear-gradient(135deg,#1e5bff,#1336a0);color:#fff;padding:20px 24px;border-radius:16px 16px 0 0">
    <strong style="font-size:18px">Blue Route Logistics</strong>
  </div>
  <div style="border:1px solid #e4e9f0;border-top:0;border-radius:0 0 16px 16px;padding:24px">
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    ${inner}
  </div>
</div>`;
}
function row(label: string, value: string): string {
  return `<tr><td style="padding:4px 12px 4px 0;color:#5c6b7b">${label}</td><td style="padding:4px 0;font-weight:600">${value}</td></tr>`;
}

export function warehouseBookingTeamEmail(
  input: WarehouseBookingInput,
  facility: Facility,
  ref: string,
): EmailBody {
  return {
    subject: `New warehouse booking ${ref} — ${facility.name}`,
    html: wrap(
      `New warehouse booking (${ref})`,
      `<table style="font-size:14px">
        ${row("Facility", `${facility.name}, ${facility.city}`)}
        ${row("Company", input.company || "—")}
        ${row("Contact", `${input.name} · ${input.email}`)}
        ${row("Phone", input.phone || "—")}
        ${row("Space", `${input.sqftRequested.toLocaleString()} ft²`)}
        ${row("Move-in", input.moveIn)}
        ${row("Term", `${input.termMonths} months`)}
        ${row("Features", input.features.length ? input.features.join(", ") : "—")}
      </table>
      <p style="margin:16px 0 4px;color:#5c6b7b;font-size:14px">Message</p>
      <p style="white-space:pre-wrap;font-size:14px">${input.message || "—"}</p>`,
    ),
  };
}

export function warehouseBookingAckEmail(
  input: WarehouseBookingInput,
  facility: Facility,
  ref: string,
): EmailBody {
  return {
    subject: `We received your warehouse request (${ref})`,
    html: wrap(
      `Thanks, ${firstName(input.name)}!`,
      `<p style="font-size:14px">We've received your request for space at
        <strong>${facility.name}</strong> (${facility.city}) and logged it as
        <strong>${ref}</strong>. No payment is taken now — our team will confirm
        availability and next steps shortly.</p>`,
    ),
  };
}

export function warehouseDecisionEmail(
  booking: { name: string; booking_ref: string; details: Record<string, unknown> },
  decision: "approved" | "rejected",
): EmailBody {
  const facilityName = String(booking.details.facilityName ?? "your requested facility");
  const approved = decision === "approved";
  return {
    subject: approved
      ? `Your warehouse request is approved (${booking.booking_ref})`
      : `Update on your warehouse request (${booking.booking_ref})`,
    html: wrap(
      approved ? `Good news, ${firstName(booking.name)}!` : `Thanks for your patience, ${firstName(booking.name)}`,
      approved
        ? `<p style="font-size:14px">Your request <strong>${booking.booking_ref}</strong> for
            <strong>${facilityName}</strong> has been <strong>approved</strong>. A leasing
            specialist will reach out to finalize the agreement and schedule your move-in.</p>`
        : `<p style="font-size:14px">After review, we're unable to confirm
            <strong>${facilityName}</strong> for request <strong>${booking.booking_ref}</strong>
            right now. Our team will follow up with alternative facilities that fit your needs.</p>`,
    ),
  };
}

export function serviceQuoteTeamEmail(
  config: ServiceQuoteConfig,
  input: ServiceQuoteInput,
  ref: string,
): EmailBody {
  const fieldRows = config.fields
    .map((f) => {
      const v = input.values[f.name];
      const val = Array.isArray(v) ? v.join(", ") : v;
      return val && val.trim() ? row(f.label, val) : "";
    })
    .join("");
  return {
    subject: `New ${config.title} ${ref}`,
    html: wrap(
      `New ${config.title.toLowerCase()} (${ref})`,
      `<table style="font-size:14px">
        ${row("Company", input.company || "—")}
        ${row("Contact", `${input.name} · ${input.email}`)}
        ${row("Phone", input.phone || "—")}
        ${fieldRows}
      </table>`,
    ),
  };
}

export function serviceQuoteAckEmail(
  config: ServiceQuoteConfig,
  input: ServiceQuoteInput,
  ref: string,
): EmailBody {
  return {
    subject: `We received your ${config.title} (${ref})`,
    html: wrap(
      `Thanks, ${firstName(input.name)}!`,
      `<p style="font-size:14px">We've received your ${config.title.toLowerCase()} and logged it as
        <strong>${ref}</strong>. No payment is taken now — our team will review the details and
        follow up with options and pricing shortly.</p>`,
    ),
  };
}
