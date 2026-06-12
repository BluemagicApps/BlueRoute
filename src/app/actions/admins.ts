"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, ALL_MENUS, type AdminMenu } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type AdminsActionResult = { ok: boolean; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanMenus(menus: string[]): AdminMenu[] {
  return ALL_MENUS.filter((m) => menus.includes(m));
}

async function requireSuperAdmin() {
  const actor = await requireAdmin("admins");
  if (actor.role !== "super_admin") {
    return { actor: null, error: "Only a super admin can manage administrators." };
  }
  return { actor, error: null };
}

export async function createManager(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "super_admin" | "manager";
  menus: string[];
  password: string;
}): Promise<AdminsActionResult> {
  const { actor, error: authError } = await requireSuperAdmin();
  if (!actor) return { ok: false, error: authError! };

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  if (!firstName || !lastName) return { ok: false, error: "First and last name are required." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email." };
  if (input.password.length < 8)
    return { ok: false, error: "Password must be at least 8 characters." };

  const supabase = getSupabaseAdmin();
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    console.error("[admins] createUser failed:", createError?.message);
    return {
      ok: false,
      error: createError?.message.includes("already")
        ? "A user with this email already exists."
        : "Could not create the user.",
    };
  }

  const { error: insertError } = await supabase.from("admins").insert({
    user_id: created.user.id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: input.phone?.trim() || null,
    role: input.role === "super_admin" ? "super_admin" : "manager",
    menus: input.role === "super_admin" ? [] : cleanMenus(input.menus),
  });
  if (insertError) {
    console.error("[admins] insert failed:", insertError.message);
    await supabase.auth.admin.deleteUser(created.user.id); // roll back the auth user
    return { ok: false, error: "Could not save the admin profile." };
  }

  revalidatePath("/admin/admins");
  return { ok: true };
}

export async function updateManager(
  userId: string,
  input: {
    role?: "super_admin" | "manager";
    menus?: string[];
    status?: "active" | "disabled";
    password?: string;
  },
): Promise<AdminsActionResult> {
  const { actor, error: authError } = await requireSuperAdmin();
  if (!actor) return { ok: false, error: authError! };
  if (actor.user_id === userId && (input.status === "disabled" || input.role === "manager")) {
    return { ok: false, error: "You can't disable or demote your own account." };
  }

  const supabase = getSupabaseAdmin();

  if (input.password) {
    if (input.password.length < 8)
      return { ok: false, error: "Password must be at least 8 characters." };
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: input.password,
    });
    if (error) {
      console.error("[admins] password update failed:", error.message);
      return { ok: false, error: "Could not update the password." };
    }
  }

  const patch: Record<string, unknown> = {};
  if (input.role) patch.role = input.role;
  if (input.menus) patch.menus = cleanMenus(input.menus);
  if (input.status) patch.status = input.status;
  if (Object.keys(patch).length) {
    const { error } = await supabase.from("admins").update(patch).eq("user_id", userId);
    if (error) {
      console.error("[admins] update failed:", error.message);
      return { ok: false, error: "Could not update the admin." };
    }
  }

  revalidatePath("/admin/admins");
  return { ok: true };
}

export async function deleteManager(userId: string): Promise<AdminsActionResult> {
  const { actor, error: authError } = await requireSuperAdmin();
  if (!actor) return { ok: false, error: authError! };
  if (actor.user_id === userId)
    return { ok: false, error: "You can't delete your own account." };

  const { error } = await getSupabaseAdmin().auth.admin.deleteUser(userId);
  if (error) {
    console.error("[admins] delete failed:", error.message);
    return { ok: false, error: "Could not delete the admin." };
  }
  // The admins row cascades via the user_id foreign key.
  revalidatePath("/admin/admins");
  return { ok: true };
}
