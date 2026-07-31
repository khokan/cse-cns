import { userService } from "@/services/user.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Award, Download, FileBarChart } from "lucide-react";
import { ReconciliationDashboard } from "@/components/modules/dashboard/ReconciliationDashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await userService.getSession();

  if (!session?.data) {
    redirect("/login");
  }

  const user = session.data.user;

  if (user.role === "ADMIN" || user.role === "IT") {
    return (
      <div className="space-y-8">
       
        <ReconciliationDashboard />
      </div>
    );
  }

  // if (user.role !== "TRECHOLDER") {
  //   redirect("/admin/dashboard");
  // }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Welcome, {user.name} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          TREC Holder Dashboard — manage your tax certificates and reports.
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/reports"
            className="group flex items-start gap-4 rounded-2xl border bg-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Generate Tax Certificate
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Certificate of Collection of Tax [Sec. 145(1)]
              </p>
            </div>
          </Link>

          <Link
            href="/reports"
            className="group flex items-start gap-4 rounded-2xl border bg-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <FileBarChart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                New Report
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Request a new report in PDF, XLSX, or CSV
              </p>
            </div>
          </Link>

          <Link
            href="/reports/download-center"
            className="group flex items-start gap-4 rounded-2xl border bg-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Download Center
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                View and download your generated reports
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-sm font-semibold mb-3">Account Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">Name</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">Role</span>
            <span className="font-medium capitalize">
              {String(user.role).toLowerCase().replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
