"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Role = {
  title: string;
  dept: string;
  location: string;
  type: string;
};

const ROLES: Role[] = [
  { title: "Senior Frontend Engineer", dept: "Engineering", location: "Rotterdam / Remote", type: "Full-time" },
  { title: "ML Engineer, Predictive ETA", dept: "AI / ML", location: "Remote (EU)", type: "Full-time" },
  { title: "Agentic AI Product Engineer", dept: "AI / ML", location: "Rotterdam", type: "Full-time" },
  { title: "Ocean Operations Specialist", dept: "Operations", location: "Singapore", type: "Full-time" },
  { title: "Customs & Compliance Lead", dept: "Operations", location: "Dubai", type: "Full-time" },
  { title: "Enterprise Account Executive", dept: "Commercial", location: "Los Angeles", type: "Full-time" },
  { title: "Sustainability Program Manager", dept: "Sustainability", location: "Rotterdam / Remote", type: "Full-time" },
  { title: "Customer Success Manager", dept: "Commercial", location: "Remote (Global)", type: "Full-time" },
];

const DEPTS = ["All", "Engineering", "AI / ML", "Operations", "Commercial", "Sustainability"];

const DEPT_TAG: Record<string, string> = {
  Engineering: "bg-cyan/10 text-cyan",
  "AI / ML": "bg-indigo/10 text-indigo",
  Operations: "bg-amber/10 text-amber",
  Commercial: "bg-teal/10 text-teal",
  Sustainability: "bg-emerald/10 text-emerald",
};

export function RolesList() {
  const [dept, setDept] = useState("All");
  const roles = useMemo(
    () => ROLES.filter((r) => dept === "All" || r.dept === dept),
    [dept]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {DEPTS.map((d) => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              dept === d
                ? "border-cyan/50 bg-cyan/10 text-cyan"
                : "border-steel/70 bg-white text-mist hover:border-cyan/30"
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {roles.map((r, i) => (
          <motion.a
            key={r.title}
            href="/contact"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.03, ease: EASE_OUT_EXPO }}
            className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-steel/70 bg-deep p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-cyan/40"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foam">{r.title}</h3>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", DEPT_TAG[r.dept])}>
                  {r.dept}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-3 text-sm text-mist">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {r.location}
                </span>
                <span>·</span>
                <span>{r.type}</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-4 py-2 text-sm font-semibold text-white">
              Apply <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
