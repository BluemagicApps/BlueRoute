"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Save, Trash2, AlertCircle, X } from "lucide-react";
import {
  addShipmentEvent,
  updateShipmentEvent,
  deleteShipmentEvent,
} from "@/app/actions/shipments";
import type { ShipmentEventRecord } from "@/components/admin/shipment-editor";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-2xl border border-steel bg-deep px-3.5 py-2.5 text-sm text-foam outline-none focus:border-cyan placeholder:text-mist/60";

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-steel/60 text-mist",
  Approved: "bg-indigo/10 text-indigo",
  "In Transit": "bg-cyan/10 text-cyan",
  "On Hold": "bg-rose/10 text-rose",
  Customs: "bg-amber/10 text-amber",
  "Out for Delivery": "bg-aqua/10 text-aqua",
  Delivered: "bg-emerald/10 text-emerald",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (ms < 3_600_000) return "just now";
  if (days < 1) return `${Math.floor(ms / 3_600_000)} hours ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${days < 60 ? "" : "s"} ago`;
  return `${Math.floor(days / 365)} year${days < 730 ? "" : "s"} ago`;
}

/** datetime-local value (local time) from an ISO timestamp. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function readEvent(form: HTMLFormElement) {
  const fd = new FormData(form);
  return {
    status: String(fd.get("status") ?? ""),
    location: String(fd.get("location") ?? ""),
    country: String(fd.get("country") ?? ""),
    comment: String(fd.get("comment") ?? ""),
    occurredAt: String(fd.get("occurredAt") ?? ""),
  };
}

export function TrackingLog({
  shipmentId,
  events,
}: {
  shipmentId: string;
  events: ShipmentEventRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setError(null);
      const res = await action();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else {
        setEditing(null);
        setAdding(false);
        router.refresh();
      }
    });
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-lg font-semibold text-foam"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Updated tracking information
        </h2>
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="inline-flex items-center gap-1.5 rounded-full border border-steel bg-deep px-3.5 py-2 text-xs font-semibold text-foam"
        >
          {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {adding ? "Cancel" : "Add entry with custom date"}
        </button>
      </div>
      <p className="mt-1 text-xs text-mist">
        Use the Actions → “Add shipment update” for a normal (now) update; the
        custom-date form below backdates. Edit any row&apos;s date to backdate it.
      </p>

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-rose/10 p-3 text-sm text-rose">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {adding && (
        <form
          className="mt-4 space-y-2 rounded-2xl border border-dashed border-steel bg-deep p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addShipmentEvent(shipmentId, readEvent(e.target as HTMLFormElement)));
          }}
        >
          <div className="grid gap-2 md:grid-cols-2">
            <input name="status" placeholder="Status (e.g. On route)" required className={inputCls} />
            <input name="location" placeholder="Location" required className={inputCls} />
            <input name="country" placeholder="Country" className={inputCls} />
            <input
              type="datetime-local"
              name="occurredAt"
              required
              defaultValue={toLocalInput(new Date().toISOString())}
              className={inputCls}
            />
          </div>
          <input name="comment" placeholder="Comment (shows on public tracking)" className={inputCls} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" /> Add entry
          </button>
        </form>
      )}

      <div className="mt-4 overflow-x-auto rounded-3xl border border-steel/70 bg-deep shadow-soft">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-steel/60 text-xs uppercase tracking-wide text-mist">
              <th className="px-5 py-3.5 font-medium">Time updated</th>
              <th className="px-5 py-3.5 font-medium">Current location</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium">Comment</th>
              <th className="px-5 py-3.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-mist">
                  No tracking history yet.
                </td>
              </tr>
            )}
            {events.map((ev) => (
              <EventRow
                key={ev.id}
                ev={ev}
                shipmentId={shipmentId}
                editing={editing === ev.id}
                pending={pending}
                onEdit={() => setEditing(editing === ev.id ? null : ev.id)}
                onRun={run}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EventRow({
  ev,
  shipmentId,
  editing,
  pending,
  onEdit,
  onRun,
}: {
  ev: ShipmentEventRecord;
  shipmentId: string;
  editing: boolean;
  pending: boolean;
  onEdit: () => void;
  onRun: (action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  return (
    <>
      <tr className="border-b border-steel/40 last:border-0">
        <td className="whitespace-nowrap px-5 py-3.5 text-mist" title={new Date(ev.occurred_at).toLocaleString()}>
          {timeAgo(ev.occurred_at)}
        </td>
        <td className="px-5 py-3.5 text-foam">
          {ev.location}
          {ev.country ? <span className="text-mist"> · {ev.country}</span> : null}
        </td>
        <td className="px-5 py-3.5">
          <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_BADGE[ev.status] ?? "bg-steel/60 text-mist")}>
            {ev.status}
          </span>
        </td>
        <td className="px-5 py-3.5 text-mist">{ev.comment ?? "—"}</td>
        <td className="whitespace-nowrap px-5 py-3.5">
          <button
            type="button"
            onClick={onEdit}
            className="mr-2 inline-flex items-center gap-1 rounded-full border border-steel bg-abyss px-3 py-1.5 text-xs font-semibold text-foam"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onRun(() => deleteShipmentEvent(ev.id, shipmentId))}
            className="inline-flex items-center gap-1 rounded-full bg-rose/10 px-3 py-1.5 text-xs font-semibold text-rose hover:bg-rose/20 disabled:opacity-60"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </td>
      </tr>
      {editing && (
        <tr className="border-b border-steel/40 bg-abyss/60">
          <td colSpan={5} className="px-5 py-4">
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                onRun(() =>
                  updateShipmentEvent(ev.id, shipmentId, readEvent(e.target as HTMLFormElement)),
                );
              }}
            >
              <div className="grid gap-2 md:grid-cols-4">
                <input name="status" defaultValue={ev.status} required className={inputCls} />
                <input name="location" defaultValue={ev.location} required className={inputCls} />
                <input name="country" defaultValue={ev.country ?? ""} placeholder="Country" className={inputCls} />
                <input
                  type="datetime-local"
                  name="occurredAt"
                  required
                  defaultValue={toLocalInput(ev.occurred_at)}
                  className={inputCls}
                />
              </div>
              <input name="comment" defaultValue={ev.comment ?? ""} placeholder="Comment" className={inputCls} />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" /> Save (date changes backdate)
              </button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
