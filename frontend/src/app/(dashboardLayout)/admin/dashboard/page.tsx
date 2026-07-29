import { userService } from "@/services/user.service";
import { redirect } from "next/navigation";
import { ReconciliationDashboard } from "@/components/modules/dashboard/ReconciliationDashboard";

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
          Reconciliation overview across Spot, A B G N, and Z settlement groups.
        </p>
      </div>
      <ReconciliationDashboard />
    </div>
  );
}
