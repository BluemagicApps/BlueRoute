"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmails, type OutgoingEmail } from "@/lib/email/resend";

export type AdminEmailInput = {
  category: "all" | "single";
  to?: string;
  greeting: string;
  subject: string;
  message: string;
};

export type AdminEmailResult = {
  ok: boolean;
  sent?: number;
  error?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function renderHtml(greeting: string, message: string): string {
  const paragraphs = message
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;line-height:1.6;color:#0b1b2b;">${p
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll("\n", "<br/>")}</p>`,
    )
    .join("");
  return `
  <div style="background:#f7f9fc;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e4e9f0;">
      <p style="margin:0 0 24px;font-size:20px;font-weight:800;color:#0b1b2b;">
        Blue <span style="color:#1e5bff;">Route</span>
      </p>
      ${greeting ? `<p style="margin:0 0 16px;line-height:1.6;color:#0b1b2b;font-weight:600;">${greeting}</p>` : ""}
      ${paragraphs}
      <p style="margin:24px 0 0;font-size:12px;color:#5c6b7b;border-top:1px solid #e4e9f0;padding-top:16px;">
        Blue Route Logistics · 3229 Hadley St, Houston, TX 77004 · +1 (323) 484-8030
      </p>
    </div>
  </div>`;
}

export async function sendAdminEmail(input: AdminEmailInput): Promise<AdminEmailResult> {
  await requireAdmin("email");

  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!subject || !message)
    return { ok: false, error: "Subject and message are required." };

  let recipients: string[] = [];
  if (input.category === "single") {
    const to = (input.to ?? "").trim();
    if (!EMAIL_RE.test(to)) return { ok: false, error: "Enter a valid recipient email." };
    recipients = [to];
  } else {
    const supabase = getSupabaseAdmin();
    const [shipmentsRes, quotesRes] = await Promise.all([
      supabase.from("shipments").select("receiver_email").not("receiver_email", "is", null),
      supabase.from("quote_requests").select("email"),
    ]);
    const set = new Set<string>();
    for (const r of shipmentsRes.data ?? []) {
      if (r.receiver_email && EMAIL_RE.test(r.receiver_email)) set.add(r.receiver_email.toLowerCase());
    }
    for (const r of quotesRes.data ?? []) {
      if (r.email && EMAIL_RE.test(r.email)) set.add(r.email.toLowerCase());
    }
    recipients = [...set];
    if (recipients.length === 0)
      return { ok: false, error: "No customer emails found yet." };
  }

  const html = renderHtml(input.greeting.trim(), message);
  const emails: OutgoingEmail[] = recipients.map((to) => ({ to, subject, html }));

  // sendEmails is best-effort and never throws; chunk to be gentle on the API.
  for (let i = 0; i < emails.length; i += 50) {
    await sendEmails(emails.slice(i, i + 50));
  }
  return { ok: true, sent: recipients.length };
}
