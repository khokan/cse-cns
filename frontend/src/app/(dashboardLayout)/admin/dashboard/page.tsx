import { userService } from "@/services/user.service";
import { redirect } from "next/navigation";
import { AdminStatsCards } from "@/components/modules/admin/AdminStatsCards";
import { AuditLogViewer } from "@/components/modules/admin/AuditLogViewer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | CSE-CNS",
  description: "System overview, stats and audit logs.",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await userService.getSession();

  if (!session?.data) {
    redirect("/login");
  }

  const user = session.data.user;

  if (user.role !== "ADMIN" && user.role !== "IT") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-linear-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Welcome, {user.name} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Admin overview: users, report jobs, settlements and audit logs.
        </p>
      </div>

      <AdminStatsCards />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Audit Logs</h2>
        <AuditLogViewer />
      </div>
    </div>
  );
}
