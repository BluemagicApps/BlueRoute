import type { Metadata } from "next";
import { requireAdmin, type AdminProfile } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ManageAdmins } from "@/components/admin/manage-admins";

export const metadata: Metadata = { title: "Administrators" };
export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const actor = await requireAdmin("admins");
  const { data } = await getSupabaseAdmin()
    .from("admins")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1
        className="text-2xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Administrators
      </h1>
      <p className="mt-1 text-sm text-mist">
        Add managers, control which menus they can access, reset passwords, or
        disable accounts. Super admins always see every menu.
      </p>
      <div className="mt-6">
        <ManageAdmins
          admins={(data ?? []) as AdminProfile[]}
          actorId={actor.user_id}
          actorIsSuper={actor.role === "super_admin"}
        />
      </div>
    </div>
  );
}
