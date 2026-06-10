import "server-only";
import { Resend } from "resend";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

let cached: Resend | null = null;
function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing.");
  cached = new Resend(key);
  return cached;
}

/** Sends each email best-effort. Logs failures; never throws. */
export async function sendEmails(emails: OutgoingEmail[]): Promise<void> {
  const from = process.env.RESEND_FROM;
  if (!from) {
    console.error("[email] RESEND_FROM missing — skipping send.");
    return;
  }
  const client = getResend();
  await Promise.all(
    emails.map(async (e) => {
      try {
        const { error } = await client.emails.send({
          from,
          to: e.to,
          subject: e.subject,
          html: e.html,
          ...(e.replyTo ? { replyTo: e.replyTo } : {}),
        });
        if (error) console.error("[email] send failed:", error);
      } catch (err) {
        console.error("[email] send threw:", err);
      }
    }),
  );
}
