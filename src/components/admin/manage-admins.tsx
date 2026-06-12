"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ChevronDown, ChevronUp, Check, AlertCircle, Trash2, Save } from "lucide-react";
import { createManager, updateManager, deleteManager } from "@/app/actions/admins";
import { ALL_MENUS, type AdminProfile } from "@/lib/admin/menus";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-2xl border border-steel bg-deep px-3.5 py-2.5 text-sm text-foam outline-none focus:border-cyan placeholder:text-mist/60";

const MENU_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  shipments: "Manage Shipments",
  create: "Create Shipment",
  email: "Email Services",
  admins: "Administrators",
  settings: "App Settings",
  "ai-audit": "AI Audit",
};

export function ManageAdmins({
  admins,
  actorId,
  actorIsSuper,
}: {
  admins: AdminProfile[];
  actorId: string;
  actorIsSuper: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, successText: string) {
    startTransition(async () => {
      setMessage(null);
      const res = await action();
      if (res.ok) {
        setMessage({ ok: true, text: successText });
        router.refresh();
      } else {
        setMessage({ ok: false, text: res.error ?? "Something went wrong." });
      }
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`flex items-start gap-2 rounded-2xl p-3 text-sm ${
            message.ok ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose"
          }`}
        >
          {message.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {message.text}
        </p>
      )}

      {actorIsSuper && <AddManagerForm pending={pending} onRun={run} />}

      <div className="overflow-x-auto rounded-3xl border border-steel/70 bg-deep shadow-soft">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-steel/60 text-xs uppercase tracking-wide text-mist">
              <th className="px-5 py-3.5 font-medium">Name</th>
              <th className="px-5 py-3.5 font-medium">Email</th>
              <th className="px-5 py-3.5 font-medium">Phone</th>
              <th className="px-5 py-3.5 font-medium">Type</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
              {actorIsSuper && <th className="px-5 py-3.5 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <AdminRow
                key={a.user_id}
                admin={a}
                isSelf={a.user_id === actorId}
                canEdit={actorIsSuper}
                pending={pending}
                onRun={run}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddManagerForm({
  pending,
  onRun,
}: {
  pending: boolean;
  onRun: (action: () => Promise<{ ok: boolean; error?: string }>, successText: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"super_admin" | "manager">("manager");
  const [menus, setMenus] = useState<string[]>(["dashboard", "shipments"]);

  return (
    <div className="rounded-3xl border border-steel/70 bg-deep p-6 shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-foam"
      >
        <UserPlus className="h-4 w-4 text-cyan" /> Add new manager
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            onRun(
              () =>
                createManager({
                  firstName: String(fd.get("firstName") ?? ""),
                  lastName: String(fd.get("lastName") ?? ""),
                  email: String(fd.get("email") ?? ""),
                  phone: String(fd.get("phone") ?? ""),
                  role,
                  menus,
                  password: String(fd.get("password") ?? ""),
                }),
              "Manager created — they can sign in at /admin/login now.",
            );
            form.reset();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <input name="firstName" required placeholder="First name" className={inputCls} />
            <input name="lastName" required placeholder="Last name" className={inputCls} />
            <input name="email" type="email" required placeholder="Email address" className={inputCls} />
            <input name="phone" placeholder="Phone number" className={inputCls} />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "super_admin" | "manager")}
              className={inputCls}
            >
              <option value="manager">Manager (limited menus)</option>
              <option value="super_admin">Super Admin (everything)</option>
            </select>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Password (min 8 chars)"
              autoComplete="new-password"
              className={inputCls}
            />
          </div>

          {role === "manager" && (
            <MenuPicker menus={menus} onChange={setMenus} />
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan to-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" /> Save user
          </button>
        </form>
      )}
    </div>
  );
}

function MenuPicker({
  menus,
  onChange,
}: {
  menus: string[];
  onChange: (menus: string[]) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-mist">
        Menu access
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ALL_MENUS.map((m) => {
          const on = menus.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(on ? menus.filter((x) => x !== m) : [...menus, m])}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                on ? "bg-gradient-to-br from-cyan to-indigo text-white" : "bg-steel/60 text-mist hover:text-foam",
              )}
            >
              {MENU_LABELS[m]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AdminRow({
  admin,
  isSelf,
  canEdit,
  pending,
  onRun,
}: {
  admin: AdminProfile;
  isSelf: boolean;
  canEdit: boolean;
  pending: boolean;
  onRun: (action: () => Promise<{ ok: boolean; error?: string }>, successText: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(admin.role);
  const [menus, setMenus] = useState<string[]>(admin.menus);
  const [password, setPassword] = useState("");

  return (
    <>
      <tr className="border-b border-steel/40 last:border-0">
        <td className="px-5 py-3.5 font-medium text-foam">
          {admin.first_name} {admin.last_name} {isSelf && <span className="text-xs text-mist">(you)</span>}
        </td>
        <td className="px-5 py-3.5 text-mist">{admin.email}</td>
        <td className="px-5 py-3.5 text-mist">{admin.phone ?? "—"}</td>
        <td className="px-5 py-3.5">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", admin.role === "super_admin" ? "bg-indigo/10 text-indigo" : "bg-cyan/10 text-cyan")}>
            {admin.role === "super_admin" ? "Super Admin" : "Manager"}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", admin.status === "active" ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose")}>
            {admin.status}
          </span>
        </td>
        {canEdit && (
          <td className="px-5 py-3.5">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="rounded-full border border-steel bg-abyss px-3.5 py-1.5 text-xs font-semibold text-foam"
            >
              {open ? "Close" : "Manage"}
            </button>
          </td>
        )}
      </tr>
      {open && canEdit && (
        <tr className="border-b border-steel/40 bg-abyss/60">
          <td colSpan={6} className="px-5 py-4">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm">
                  <span className="font-medium text-foam">Type</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "super_admin" | "manager")}
                    disabled={isSelf}
                    className={`${inputCls} mt-1.5 disabled:opacity-50`}
                  >
                    <option value="manager">Manager</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-foam">New password (optional)</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep"
                    autoComplete="new-password"
                    className={`${inputCls} mt-1.5`}
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      onRun(
                        () =>
                          updateManager(admin.user_id, {
                            role,
                            menus,
                            ...(password ? { password } : {}),
                          }),
                        "Admin updated.",
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan to-indigo px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" /> Save
                  </button>
                  {!isSelf && (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          onRun(
                            () =>
                              updateManager(admin.user_id, {
                                status: admin.status === "active" ? "disabled" : "active",
                              }),
                            admin.status === "active" ? "Admin disabled." : "Admin re-enabled.",
                          )
                        }
                        className="rounded-full border border-steel bg-deep px-4 py-2.5 text-sm font-medium text-foam disabled:opacity-60"
                      >
                        {admin.status === "active" ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (confirm(`Delete ${admin.email}? This cannot be undone.`)) {
                            onRun(() => deleteManager(admin.user_id), "Admin deleted.");
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-rose/10 px-4 py-2.5 text-sm font-semibold text-rose hover:bg-rose/20 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              {role === "manager" && <MenuPicker menus={menus} onChange={setMenus} />}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
