import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ALL_MENUS, type AdminMenu, type AdminProfile } from "@/lib/admin/menus";

export { ALL_MENUS, type AdminMenu, type AdminProfile };

/** The signed-in user's admin profile, or null (not signed in / not an admin / disabled). */
export async function getAdmin(): Promise<AdminProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await getSupabaseAdmin()
    .from("admins")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data || data.status !== "active") return null;
  const menus = data.role === "super_admin" ? ALL_MENUS : ((data.menus ?? []) as AdminMenu[]);
  return { ...data, menus } as AdminProfile;
}

/** Layout/action gate. Optionally require a specific menu permission. */
export async function requireAdmin(menu?: AdminMenu): Promise<AdminProfile> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (menu && !admin.menus.includes(menu)) redirect("/admin");
  return admin;
}
