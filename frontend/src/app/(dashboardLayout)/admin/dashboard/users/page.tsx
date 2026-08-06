import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { userService } from "@/services/user.service";
import { AdminUsersManager } from "@/components/modules/admin/AdminUsersManager";
import { Users } from "lucide-react";

export const metadata: Metadata = {
    title: "User Management | CSE-CNS",
    description: "Create, view, edit, activate and manage system users.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "IT", "ACCOUNTING"];

export default async function UsersPage() {
    const session = await userService.getSession();
    if (!session?.data) redirect("/login");

    const sessionRole: string = session.data.user.role ?? "";
    if (!ALLOWED_ROLES.includes(sessionRole)) redirect("/dashboard");

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    {sessionRole === "ADMIN"
                        ? "Create, edit, activate/deactivate, and delete users."
                        : "Create, edit, and activate/deactivate users."}
                </p>
            </div>

            <AdminUsersManager sessionRole={sessionRole} />
        </div>
    );
}
