"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
    >
      <Printer className="h-4 w-4" /> Print invoice
    </button>
  );
}
