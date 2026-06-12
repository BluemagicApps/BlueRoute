"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { setBookingStatus } from "@/app/actions/bookings";

const BADGE: Record<string, string> = {
  new: "bg-cyan/10 text-cyan",
  approved: "bg-emerald/10 text-emerald",
  rejected: "bg-rose/10 text-rose",
  closed: "bg-steel/60 text-mist",
};

export function BookingActions({ id, status: initial }: { id: string; status: string }) {
  const [status, setStatus] = useState(initial);
  const [pending, startTransition] = useTransition();

  function decide(next: "approved" | "rejected") {
    startTransition(async () => {
      const res = await setBookingStatus(id, next);
      if (res.ok) setStatus(next);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BADGE[status] ?? BADGE.closed}`}>
        {status}
      </span>
      {status === "new" && (
        <>
          <button type="button" onClick={() => decide("approved")} disabled={pending} aria-label="Approve" className="grid h-7 w-7 place-items-center rounded-full border border-steel text-emerald hover:border-emerald/50 disabled:opacity-50">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => decide("rejected")} disabled={pending} aria-label="Reject" className="grid h-7 w-7 place-items-center rounded-full border border-steel text-rose hover:border-rose/50 disabled:opacity-50">
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
