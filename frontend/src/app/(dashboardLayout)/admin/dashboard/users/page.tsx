import type { AdminUser } from "@/components/modules/admin/AdminUsersTable";
import AdminUsersTable from "@/components/modules/admin/AdminUsersTable";
import { trecholderService } from "@/services/trecholder.service";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { data } = await trecholderService.listUsers();

  const parsedUsers = (() => {
    if (!data) return [] as AdminUser[];
    if (Array.isArray(data)) return data as AdminUser[];
    if (Array.isArray((data as { data?: { items?: AdminUser[] } }).data?.items)) {
      return (data as { data?: { items?: AdminUser[] } }).data!.items!;
    }
    if (Array.isArray((data as { data?: AdminUser[] }).data)) {
      return (data as { data?: AdminUser[] }).data as AdminUser[];
    }
    return [] as AdminUser[];
  })();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Review and manage registered users. Admins can view roles and trecholder counts.
        </p>
      </div>

      <AdminUsersTable users={parsedUsers} />
    </div>
  );
}
