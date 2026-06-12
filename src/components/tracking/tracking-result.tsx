"use client";

import { Printer, AlertTriangle } from "lucide-react";
import type { TrackPayload, TrackEvent } from "@/lib/tracking/payload";
import { Barcode } from "@/components/ui/barcode";
import { RouteMap } from "@/components/ui/route-map";

const fmtDate = (iso: string | null, withTime = false) => {
  if (!iso) return "—";
  // Bare DB `date` values ("2026-05-12") must parse as local midnight, not UTC,
  // or western viewers see the previous day. Full timestamps parse as-is.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
};

const fmtMoney = (v: number | null) =>
  v == null ? "—" : `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export function TrackingResult({ data }: { data: TrackPayload }) {
  const c = data.consignment;
  return (
    <div id="tracking-report" className="mt-12 space-y-10">
      {/* Intro + barcode (mockup 14) */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
          Tracking Result
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-mist">
          A consignment was sent to you through Blue Route Logistics. You can keep
          track of your freight through this tracking system at any time. If you
          need assistance, contact us via the contact page.
        </p>
        <p className="mt-5 text-sm font-semibold text-foam">
          Your consignment details are as stated below
        </p>
        <div className="mt-4 flex justify-center overflow-x-auto rounded-2xl bg-white p-4">
          <Barcode value={c.trackingNumber} />
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft"
        >
          <Printer className="h-4 w-4" /> Print shipping invoice
        </button>
      </div>

      {/* Map (mockup 15) */}
      <div className="no-print rounded-3xl border border-steel/70 bg-deep p-1.5 shadow-soft">
        <RouteMap
          origin={data.map.origin}
          destination={data.map.destination}
          current={data.map.current}
          progressPct={c.deliveryPct}
        />
      </div>

      {/* Parties (mockup 15) */}
      <DetailTable
        title="Receiver's Details"
        head={["Full Name", "Address", "Email Address", "Phone Number"]}
        rows={[[data.receiver.name, joinLoc(data.receiver.address, data.receiver.country), data.receiver.email ?? "—", data.receiver.phone ?? "—"]]}
      />
      <DetailTable
        title="Sender's Details"
        head={["Sender's Name", "Address", "Sender Email", "Phone Number"]}
        rows={[[data.sender.name, joinLoc(data.sender.address, data.sender.country), data.sender.email ?? "—", data.sender.phone ?? "—"]]}
      />

      {/* Consignment (mockup 16) */}
      <DetailTable
        title="Consignment's Details"
        head={["Consignment No", "Package Weight", "Status", "Service Type", "Delivery Mode", "Delivery Completion"]}
        rows={[[
          c.trackingNumber,
          c.weightKg == null ? "—" : `${c.weightKg.toLocaleString("en-US")} kg`,
          c.status,
          c.contentType ?? "—",
          c.freightType,
          `${c.deliveryPct}% Complete`,
        ]]}
      />
      <DetailTable
        head={["Origin", "Destination", "Date of Departure", "Expected delivery date"]}
        rows={[[c.origin, c.destination, fmtDate(c.dateShipped), fmtDate(c.expectedDelivery)]]}
      />
      <DetailTable
        head={["Shipment Cost", "Clearance Cost", "Quantity", "Description"]}
        rows={[[fmtMoney(c.shipmentCost), fmtMoney(c.clearanceCost), c.qty ?? "—", c.description ?? "—"]]}
      />

      {/* Progress bar (mockup 16) */}
      <div className="px-1">
        <div className="relative h-2.5 rounded-full bg-rose/25">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan to-indigo transition-[width] duration-[1500ms] ease-out"
            style={{ width: `${c.deliveryPct}%` }}
          />
          <span
            className="absolute -top-2.5 grid h-7 -translate-x-1/2 place-items-center rounded-full bg-foam px-2 text-[11px] font-bold text-white"
            style={{ left: `${Math.min(96, Math.max(4, c.deliveryPct))}%` }}
          >
            {c.deliveryPct}%
          </span>
        </div>
        <div className="mt-2 flex justify-between text-xs text-mist">
          <span>{c.origin}</span>
          <span>{c.destination}</span>
        </div>
      </div>

      {/* Tracking log (mockups 16–17) */}
      <DetailTable
        title="Tracking Log"
        head={["Status", "Current Location", "Arrival Country", "Date and Time", "Comments"]}
        rows={
          data.events.length
            ? data.events.map((e: TrackEvent) => [
                e.status,
                e.location,
                e.country ?? "—",
                fmtDate(e.occurredAt, true),
                e.comment ?? "—",
              ])
            : [["—", "No tracking events recorded yet", "—", "—", "—"]]
        }
      />

      {/* Notice banner (mockup 17) */}
      {data.notice && (
        <div className="flex items-start gap-3 rounded-3xl border border-amber/40 bg-amber/10 p-6 text-center">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
          <p className="w-full text-sm font-semibold leading-relaxed text-foam">
            Notice: {data.notice}
          </p>
        </div>
      )}

      <p className="rounded-2xl bg-navy py-3 text-center text-sm text-mist">
        Thanks for choosing Blue Route. Feel free to track your consignment anytime.
      </p>
    </div>
  );
}

function joinLoc(address: string | null, country: string | null) {
  return [address, country].filter(Boolean).join(", ") || "—";
}

function DetailTable({
  title,
  head,
  rows,
}: {
  title?: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <section>
      {title && (
        <h3 className="mb-3 text-lg font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h3>
      )}
      <div className="overflow-x-auto rounded-2xl border border-steel/70 shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-foam text-xs uppercase tracking-wide text-white">
            <tr>
              {head.map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-steel/60 bg-deep text-foam">
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3.5 align-top">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
