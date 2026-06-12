"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ship,
  PackagePlus,
  Mail,
  Users,
  Settings,
  Bot,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarItem = {
  key: string;
  label: string;
  href: string;
};

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  shipments: Ship,
  create: PackagePlus,
  email: Mail,
  admins: Users,
  settings: Settings,
  "ai-audit": Bot,
};

export function AdminSidebar({
  items,
  adminName,
  role,
}: {
  items: SidebarItem[];
  adminName: string;
  role: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-foam text-white">
      <div className="px-5 pt-6">
        <p className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Blue <span className="text-aqua">Route</span>
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/70">
            Admin
          </span>
        </p>
        <div className="mt-5 rounded-2xl bg-white/5 p-3">
          <p className="truncate text-sm font-semibold">{adminName}</p>
          <p className="mt-0.5 text-xs capitalize text-white/60">
            {role.replace("_", " ")}
          </p>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {items.map((item) => {
          const Icon = ICONS[item.key] ?? LayoutDashboard;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-gradient-to-r from-cyan to-indigo text-white"
                  : "text-white/65 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action="/auth/signout" method="POST" className="p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" /> Sign out
        </button>
      </form>
    </aside>
  );
}
