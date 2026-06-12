import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin("dashboard");
  return (
    <div>
      <h1
        className="text-2xl font-semibold text-foam"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Welcome back, {admin.first_name}
      </h1>
      <p className="mt-2 text-sm text-mist">
        Dashboard data lands here in the next task.
      </p>
    </div>
  );
}
