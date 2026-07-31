import { userService } from "@/services/user.service";
import { redirect } from "next/navigation";
import { AdminStatsCards } from "@/components/modules/admin/AdminStatsCards";
import { AuditLogViewer } from "@/components/modules/admin/AuditLogViewer";
import type { Metadata } from "next";
import AdminDashboard from "@/components/modules/admin-dashboard/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | CSE-CNS",
  description: "System overview, stats and audit logs.",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
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
        <AdminDashboard />
      <AdminStatsCards />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Audit Logs</h2>
        <AuditLogViewer />
      </div>
    </div>
  );
}
