// Client-safe admin menu/profile types (no server-only imports).

export type AdminMenu =
  | "dashboard"
  | "shipments"
  | "create"
  | "email"
  | "admins"
  | "settings"
  | "ai-audit";

export const ALL_MENUS: AdminMenu[] = [
  "dashboard",
  "shipments",
  "create",
  "email",
  "admins",
  "settings",
  "ai-audit",
];

export type AdminProfile = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: "super_admin" | "manager";
  menus: AdminMenu[];
  status: "active" | "disabled";
};
