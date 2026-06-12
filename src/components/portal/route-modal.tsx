"use client";

import { X } from "lucide-react";
import { RouteMap } from "@/components/ui/route-map";
import type { Shipment } from "@/lib/portal-data";

export function RouteModal({
  shipment,
  onClose,
}: {
  shipment: Shipment;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foam/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Route for ${shipment.ref}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl border border-steel/70 bg-deep p-5 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foam" style={{ fontFamily: "var(--font-display)" }}>
              {shipment.ref}
            </h2>
            <p className="mt-0.5 text-sm text-mist">
              {shipment.lane} · {shipment.status} · {shipment.progress}% complete
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-steel text-mist hover:border-cyan/50 hover:text-foam"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <RouteMap
          origin={shipment.route.origin}
          destination={shipment.route.destination}
          current={null}
          progressPct={shipment.progress}
          className="h-[380px]"
        />
      </div>
    </div>
  );
}
