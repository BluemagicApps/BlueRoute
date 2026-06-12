import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { EmailComposer } from "@/components/admin/email-composer";

export const metadata: Metadata = { title: "Email Services" };

export default async function AdminEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  await requireAdmin("email");
  const { to } = await searchParams;

  return (
    <div>
      <h1
        className="text-2xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Send email to customers
      </h1>
      <p className="mt-1 text-sm text-mist">
        Branded emails via Resend — to every known customer or a single address.
      </p>
      <div className="mt-6 max-w-2xl">
        <EmailComposer initialTo={to} />
      </div>
    </div>
  );
}
