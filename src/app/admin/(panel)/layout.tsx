import type { Metadata } from "next";
import { requireAdmin, type AdminMenu } from "@/lib/admin/auth";
import { AdminSidebar, type SidebarItem } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Blue Route Admin" },
  robots: { index: false, follow: false },
};

const NAV: { key: AdminMenu; label: string; href: string }[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "shipments", label: "Manage Shipments", href: "/admin/shipments" },
  { key: "create", label: "Create Shipment", href: "/admin/shipments/new" },
  { key: "bookings", label: "Bookings", href: "/admin/bookings" },
  { key: "email", label: "Email Services", href: "/admin/email" },
  { key: "admins", label: "Administrators", href: "/admin/admins" },
  { key: "settings", label: "App Settings", href: "/admin/settings" },
  { key: "ai-audit", label: "AI Audit", href: "/admin/ai-audit" },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();
  const items: SidebarItem[] = NAV.filter((n) => admin.menus.includes(n.key));

  return (
    <div className="flex min-h-screen bg-abyss">
      <AdminSidebar
        items={items}
        adminName={`${admin.first_name} ${admin.last_name}`}
        role={admin.role}
      />
      <main className="min-w-0 flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}
