"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, AlertCircle } from "lucide-react";
import { updateShipment } from "@/app/actions/shipments";
import { FREIGHT_TYPES, SHIPMENT_STATUSES } from "@/lib/admin/shipment-validate";

export type ShipmentRecord = {
  id: string;
  tracking_number: string;
  receiver_name: string;
  receiver_email: string | null;
  receiver_phone: string | null;
  receiver_address: string | null;
  receiver_country: string | null;
  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;
  sender_address: string | null;
  sender_country: string | null;
  origin: string;
  destination: string;
  freight_type: string;
  content_type: string | null;
  weight_kg: number | null;
  qty: number | null;
  description: string | null;
  status: string;
  date_shipped: string | null;
  expected_delivery: string | null;
  current_location: string | null;
  current_city: string | null;
  shipment_cost: number | null;
  clearance_cost: number | null;
  delivery_pct: number;
  photo_url: string | null;
  notice: string | null;
};

export type ShipmentEventRecord = {
  id: string;
  shipment_id: string;
  occurred_at: string;
  status: string;
  location: string;
  country: string | null;
  comment: string | null;
};

/* ---------- small form primitives (shared look) ---------- */

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-foam">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-xs text-rose">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-2xl border border-steel bg-deep px-3.5 py-2.5 text-sm text-foam outline-none focus:border-cyan placeholder:text-mist/60";

/* ---------- main editor ---------- */

export function ShipmentEditor({ shipment }: { shipment: ShipmentRecord }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submitDetails(formData: FormData) {
    startTransition(async () => {
      setMessage(null);
      const res = await updateShipment(shipment.id, formData);
      setErrors(res.errors ?? {});
      setMessage(
        res.ok
          ? { ok: true, text: "Shipment saved." }
          : { ok: false, text: res.error ?? "Fix the highlighted fields." },
      );
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="mt-6">
      {/* Details form */}
      <form action={submitDetails} className="space-y-6">
        <Section title="Recipient">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" error={errors.receiver_name}>
              <input name="receiver_name" defaultValue={shipment.receiver_name} className={inputCls} />
            </Field>
            <Field label="Email" error={errors.receiver_email}>
              <input name="receiver_email" defaultValue={shipment.receiver_email ?? ""} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input name="receiver_phone" defaultValue={shipment.receiver_phone ?? ""} className={inputCls} />
            </Field>
            <Field label="Country">
              <input name="receiver_country" defaultValue={shipment.receiver_country ?? ""} className={inputCls} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Contact address">
                <input name="receiver_address" defaultValue={shipment.receiver_address ?? ""} className={inputCls} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Sender">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" error={errors.sender_name}>
              <input name="sender_name" defaultValue={shipment.sender_name} className={inputCls} />
            </Field>
            <Field label="Email" error={errors.sender_email}>
              <input name="sender_email" defaultValue={shipment.sender_email ?? ""} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input name="sender_phone" defaultValue={shipment.sender_phone ?? ""} className={inputCls} />
            </Field>
            <Field label="Country">
              <input name="sender_country" defaultValue={shipment.sender_country ?? ""} className={inputCls} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <input name="sender_address" defaultValue={shipment.sender_address ?? ""} className={inputCls} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Shipping">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Origin (take-off point)" error={errors.origin}>
              <input name="origin" defaultValue={shipment.origin} className={inputCls} />
            </Field>
            <Field label="Final destination" error={errors.destination}>
              <input name="destination" defaultValue={shipment.destination} className={inputCls} />
            </Field>
            <Field label="Freight type" error={errors.freight_type}>
              <select name="freight_type" defaultValue={shipment.freight_type} className={inputCls}>
                {FREIGHT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Content type">
              <input name="content_type" defaultValue={shipment.content_type ?? ""} className={inputCls} placeholder="Container, Parcel, Palletâ€¦" />
            </Field>
            <Field label="Weight (kg)" error={errors.weight_kg}>
              <input name="weight_kg" defaultValue={shipment.weight_kg ?? ""} className={inputCls} inputMode="decimal" />
            </Field>
            <Field label="Quantity" error={errors.qty}>
              <input name="qty" defaultValue={shipment.qty ?? ""} className={inputCls} inputMode="numeric" />
            </Field>
            <Field label="Date shipped">
              <input type="date" name="date_shipped" defaultValue={shipment.date_shipped ?? ""} className={inputCls} />
            </Field>
            <Field label="Expected delivery">
              <input type="date" name="expected_delivery" defaultValue={shipment.expected_delivery ?? ""} className={inputCls} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Brief description">
                <textarea name="description" defaultValue={shipment.description ?? ""} rows={2} className={inputCls} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Status & location">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status" error={errors.status}>
              <select name="status" defaultValue={shipment.status} className={inputCls}>
                {SHIPMENT_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Delivery completed (%)" error={errors.delivery_pct}>
              <input name="delivery_pct" defaultValue={shipment.delivery_pct} className={inputCls} inputMode="numeric" />
            </Field>
            <Field label="Current location (address)">
              <input name="current_location" defaultValue={shipment.current_location ?? ""} className={inputCls} />
            </Field>
            <Field label="Current city (shown on the map)">
              <input name="current_city" defaultValue={shipment.current_city ?? ""} className={inputCls} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notice banner (urgent message on the public tracking page â€” leave empty for none)">
                <textarea name="notice" defaultValue={shipment.notice ?? ""} rows={2} className={inputCls} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Costs & photo">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Shipment cost (USD)" error={errors.shipment_cost}>
              <input name="shipment_cost" defaultValue={shipment.shipment_cost ?? ""} className={inputCls} inputMode="decimal" />
            </Field>
            <Field label="Clearance cost (USD)" error={errors.clearance_cost}>
              <input name="clearance_cost" defaultValue={shipment.clearance_cost ?? ""} className={inputCls} inputMode="decimal" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Cargo photo (replaces the current one)">
                <input type="file" name="photo" accept="image/*" className="text-sm text-mist file:mr-3 file:rounded-full file:border-0 file:bg-steel/60 file:px-4 file:py-2 file:text-sm file:font-medium file:text-foam" />
              </Field>
              {shipment.photo_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={shipment.photo_url} alt="Cargo" className="mt-3 h-28 rounded-2xl object-cover" />
              )}
            </div>
          </div>
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {pending ? "Savingâ€¦" : "Save shipment"}
          </button>
          {message && (
            <span className={`inline-flex items-center gap-1.5 text-sm ${message.ok ? "text-emerald" : "text-rose"}`}>
              {message.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

