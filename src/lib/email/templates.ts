import type { ContactInput } from "@/lib/leads/types";
import type { ResolvedBooking } from "@/lib/leads/booking";

export type EmailBody = { subject: string; html: string };
type Person = { name: string; email: string };

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
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

export function contactTeamEmail(c: ContactInput, ticketRef: string): EmailBody {
  return {
    subject: `New inquiry ${ticketRef} — ${c.topic || "General"}`,
    html: wrap(
      `New contact inquiry (${ticketRef})`,
      `<table style="font-size:14px">
        ${row("Name", c.name)}
        ${row("Company", c.company || "—")}
        ${row("Email", c.email)}
        ${row("Topic", c.topic || "—")}
      </table>
      <p style="margin:16px 0 4px;color:#5c6b7b;font-size:14px">Message</p>
      <p style="white-space:pre-wrap;font-size:14px">${c.message}</p>`,
    ),
  };
}

export function contactAckEmail(c: ContactInput, ticketRef: string): EmailBody {
  return {
    subject: `We received your message (${ticketRef})`,
    html: wrap(
      `Thanks, ${firstName(c.name)}!`,
      `<p style="font-size:14px">We've received your inquiry and logged it as
        <strong>${ticketRef}</strong>. A specialist will reply within 2 business hours.</p>
      <p style="font-size:14px;color:#5c6b7b">Need an answer right now? Our AI Advisor is available 24/7 on blueroute.com.</p>`,
    ),
  };
}

export function bookingTeamEmail(p: Person, b: ResolvedBooking, bookingRef: string): EmailBody {
  return {
    subject: `New booking request ${bookingRef} — ${b.origin.code}→${b.destination.code}`,
    html: wrap(
      `New booking request (${bookingRef})`,
      `<table style="font-size:14px">
        ${row("Customer", `${p.name} · ${p.email}`)}
        ${row("Route", `${b.origin.label} → ${b.destination.label}`)}
        ${row("Service", b.mode === "door-to-door" ? "Door-to-Door" : "Port-to-Port")}
        ${row("Container", b.container.label)}
        ${row("Option", `${b.option.name} · ${b.option.transitDays} days`)}
        ${row("Freight", usd(b.option.priceUSD))}
        ${row("Insurance", b.insurance ? usd(b.insuranceFeeUSD) : "—")}
        ${row("Total", usd(b.totalUSD))}
      </table>`,
    ),
  };
}

export function bookingAckEmail(p: Person, b: ResolvedBooking, bookingRef: string): EmailBody {
  return {
    subject: `Your booking request ${bookingRef}`,
    html: wrap(
      `Thanks, ${firstName(p.name)} — request received`,
      `<p style="font-size:14px">Your booking request <strong>${bookingRef}</strong> for
        <strong>${b.origin.label} → ${b.destination.label}</strong> is in. No payment is taken now —
        our team will confirm availability and next steps by email.</p>
      <table style="font-size:14px">
        ${row("Option", `${b.option.name} · ${b.option.transitDays} days`)}
        ${row("Estimated total", usd(b.totalUSD))}
      </table>`,
    ),
  };
}
