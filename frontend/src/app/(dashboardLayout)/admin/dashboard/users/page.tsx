import { AdminUsersManager } from "@/components/modules/admin/AdminUsersManager";

export const dynamic = "force-dynamic";

export default function UsersPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Review and manage registered users, roles and statuses.
        </p>
      </div>

      <AdminUsersManager />
    </div>
  );
}
