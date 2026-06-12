"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  History,
  Pencil,
  Printer,
  Mail,
  X,
  AlertCircle,
} from "lucide-react";
import { addShipmentUpdate } from "@/app/actions/shipments";
import { SHIPMENT_STATUSES } from "@/lib/admin/shipment-validate";

const inputCls =
  "w-full rounded-2xl border border-steel bg-deep px-3.5 py-2.5 text-sm text-foam outline-none focus:border-cyan placeholder:text-mist/60";

export function ShipmentActions({
  shipmentId,
  receiverName,
  receiverEmail,
}: {
  shipmentId: string;
  receiverName: string;
  receiverEmail: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const itemCls =
    "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-foam hover:bg-abyss";

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
        >
          Actions <ChevronDown className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-steel bg-deep py-1.5 shadow-soft">
            <button
              type="button"
              className={itemCls}
              onClick={() => {
                setMenuOpen(false);
                setModalOpen(true);
              }}
            >
              <History className="h-4 w-4 text-cyan" /> Add shipment update
            </button>
            <Link
              href={`/admin/shipments/${shipmentId}/edit`}
              className={itemCls}
              onClick={() => setMenuOpen(false)}
            >
              <Pencil className="h-4 w-4 text-indigo" /> Edit shipment
            </Link>
            <Link
              href={`/admin/shipments/${shipmentId}/invoice`}
              className={itemCls}
              onClick={() => setMenuOpen(false)}
            >
              <Printer className="h-4 w-4 text-teal" /> Print invoice
            </Link>
            <Link
              href={`/admin/email${receiverEmail ? `?to=${encodeURIComponent(receiverEmail)}` : ""}`}
              className={itemCls}
              onClick={() => setMenuOpen(false)}
            >
              <Mail className="h-4 w-4 text-amber" /> Send email
            </Link>
          </div>
        )}
      </div>

      {modalOpen && (
        <UpdateModal
          shipmentId={shipmentId}
          receiverName={receiverName}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function UpdateModal({
  shipmentId,
  receiverName,
  onClose,
}: {
  shipmentId: string;
  receiverName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setError(null);
      const res = await addShipmentUpdate(shipmentId, {
        location: String(fd.get("location") ?? ""),
        city: String(fd.get("city") ?? ""),
        country: String(fd.get("country") ?? ""),
        status: String(fd.get("status") ?? ""),
        deliveryPct: String(fd.get("deliveryPct") ?? ""),
        comment: String(fd.get("comment") ?? ""),
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save the update.");
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foam/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <h2
            className="text-lg font-semibold text-foam"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Update shipment status for {receiverName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-mist hover:bg-abyss hover:text-foam"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-2xl bg-rose/10 p-3 text-sm text-rose">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-foam">New location address *</span>
            <input name="location" required placeholder="e.g. Port Klang terminal 4" className={`${inputCls} mt-1.5`} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foam">New location city (shows on the map)</span>
            <input name="city" placeholder="e.g. Port Klang, Malaysia" className={`${inputCls} mt-1.5`} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foam">New location country</span>
            <input name="country" placeholder="e.g. Malaysia" className={`${inputCls} mt-1.5`} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foam">New status *</span>
            <select name="status" required defaultValue="" className={`${inputCls} mt-1.5`}>
              <option value="" disabled>
                Select new status
              </option>
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foam">Delivery percentage complete</span>
            <input name="deliveryPct" inputMode="numeric" placeholder="0–100" className={`${inputCls} mt-1.5`} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foam">Comment</span>
            <textarea name="comment" rows={3} placeholder="Shows on the public tracking page" className={`${inputCls} mt-1.5`} />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {pending ? "Updating…" : "Update history"}
          </button>
        </form>
      </div>
    </div>
  );
}
