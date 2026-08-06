"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getUsers,
    updateUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
} from "@/services/admin.service";
import { TanstackDataTable } from "@/components/modules/datatable/tanstack-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Loader2,
    Pencil,
    PowerOff,
    Power,
    Trash2,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { UserItem } from "@/types/admin.types";
import { CreateUserSheet } from "./CreateUserSheet";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = ["ADMIN", "IT", "ACCOUNTING", "TRECHOLDER", "MARKETING"];

const STATUS_BADGE: Record<
    string,
    { label: string; className: string }
> = {
    ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    INACTIVE: { label: "Inactive", className: "bg-slate-100 text-slate-600 border-slate-200" },
    SUSPENDED: { label: "Suspended", className: "bg-amber-100 text-amber-800 border-amber-200" },
    BLOCKED: { label: "Blocked", className: "bg-red-100 text-red-800 border-red-200" },
    DELETED: { label: "Deleted", className: "bg-red-200 text-red-900 border-red-300" },
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AdminUsersManagerProps {
    /** Current session user's role — drives conditional rendering */
    sessionRole: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function AdminUsersManager({ sessionRole }: AdminUsersManagerProps) {
    const queryClient = useQueryClient();
    const isAdmin = sessionRole === "ADMIN";
    const canManage = isAdmin || sessionRole === "ACCOUNTING";

    // Edit dialog state
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editTrecId, setEditTrecId] = useState("");
    const [editRole, setEditRole] = useState("");

    // ─── Queries ────────────────────────────────────────────────────────────────

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "users"],
        queryFn: async () => {
            const res = await getUsers();
            if (res.error) throw new Error(res.error.message);
            return res.data!;
        },
    });

    // ─── Mutations ──────────────────────────────────────────────────────────────

    const updateProfileMutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: Pick<UserItem, "name" | "email"> & { trecHolderId?: string };
        }) => updateUser(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            setEditingUser(null);
            toast.success("User profile updated.");
        },
        onError: (err: Error) =>
            toast.error("Failed to update user", { description: err.message }),
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) =>
            updateUserRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            setEditingUser(null);
            toast.success("User role updated.");
        },
        onError: (err: Error) =>
            toast.error("Failed to update role", { description: err.message }),
    });

    const statusMutation = useMutation({
        mutationFn: ({
            id,
            newStatus,
        }: {
            id: string;
            newStatus: "ACTIVE" | "INACTIVE";
        }) => toggleUserStatus(id, newStatus),
        onSuccess: (_data, vars) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            toast.success(
                vars.newStatus === "ACTIVE" ? "User activated." : "User deactivated."
            );
        },
        onError: (err: Error) =>
            toast.error("Failed to toggle status", { description: err.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            toast.success("User deleted.");
        },
        onError: (err: Error) =>
            toast.error("Failed to delete user", { description: err.message }),
    });

    // ─── Handlers ───────────────────────────────────────────────────────────────

    const openEdit = (user: UserItem) => {
        setEditingUser(user);
        setEditName(user.name ?? "");
        setEditEmail(user.email ?? "");
        setEditTrecId(user.trecHolderId ?? "");
        setEditRole(user.role ?? "");
    };

    const handleSave = () => {
        if (!editingUser) return;

        // Always update profile fields
        updateProfileMutation.mutate({
            id: editingUser.id,
            payload: {
                name: editName,
                email: editEmail,
                trecHolderId: editTrecId || undefined,
            },
        });

        // Only ADMIN can change role — fire separately if changed
        if (isAdmin && editRole !== editingUser.role) {
            updateRoleMutation.mutate({ id: editingUser.id, role: editRole });
        }
    };

    const handleToggleStatus = (user: UserItem) => {
        const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        statusMutation.mutate({ id: user.id, newStatus });
    };

    const isSaving =
        updateProfileMutation.isPending || updateRoleMutation.isPending;

    // ─── Columns ────────────────────────────────────────────────────────────────

    const columns: ColumnDef<UserItem>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <span className="font-medium">{row.original.name || "—"}</span>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ getValue }) => (
                <span className="text-sm text-muted-foreground">{String(getValue())}</span>
            ),
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => (
                <Badge
                    variant={row.original.role === "ADMIN" ? "destructive" : "secondary"}
                    className="text-xs"
                >
                    {row.original.role}
                </Badge>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const cfg = STATUS_BADGE[row.original.status] ?? STATUS_BADGE.INACTIVE;
                return (
                    <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}
                    >
                        {cfg.label}
                    </span>
                );
            },
        },
        {
            accessorKey: "trecHolderId",
            header: "TRec ID",
            cell: ({ getValue }) => (
                <span className="text-xs text-muted-foreground">
                    {String(getValue() ?? "—")}
                </span>
            ),
        },
        {
            accessorKey: "createdAt",
            header: "Joined",
            cell: ({ getValue }) =>
                new Date(getValue() as string).toLocaleDateString(),
        },
    ];

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            <TanstackDataTable
                columns={columns}
                data={data?.data ?? []}
                searchKeys={["name", "email", "role"]}
                noDataText={isLoading ? "Loading users…" : "No users found."}
                topRightActions={
                    canManage ? (
                        <CreateUserSheet canAssignAdminRole={isAdmin} />
                    ) : undefined
                }
                renderRowActions={(user) => (
                    <div className="flex items-center justify-end gap-1">
                        {/* Security manage */}
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/security/users/${user.id}`} id={`user-security-${user.id}`}>
                                <ShieldCheck className="h-4 w-4 text-primary" />
                            </Link>
                        </Button>

                        {/* Edit */}
                        {canManage && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(user)}
                                id={`user-edit-${user.id}`}
                                aria-label="Edit user"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Toggle Status */}
                        {canManage && user.status !== "DELETED" && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleStatus(user)}
                                disabled={statusMutation.isPending}
                                id={`user-status-${user.id}`}
                                aria-label={
                                    user.status === "ACTIVE"
                                        ? "Deactivate user"
                                        : "Activate user"
                                }
                                className={
                                    user.status === "ACTIVE"
                                        ? "text-amber-600 hover:text-amber-700"
                                        : "text-emerald-600 hover:text-emerald-700"
                                }
                            >
                                {statusMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : user.status === "ACTIVE" ? (
                                    <PowerOff className="h-4 w-4" />
                                ) : (
                                    <Power className="h-4 w-4" />
                                )}
                            </Button>
                        )}

                        {/* Delete — ADMIN only */}
                        {isAdmin && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        id={`user-delete-${user.id}`}
                                        aria-label="Delete user"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete user?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will soft-delete{" "}
                                            <strong>{user.name ?? user.email}</strong>. They will
                                            lose access immediately. This action can only be undone
                                            by a database administrator.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() => deleteMutation.mutate(user.id)}
                                            id={`user-delete-confirm-${user.id}`}
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                )}
            />

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Editing <strong>{editingUser?.email}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Full name"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="email@example.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-trec">Trec Holder ID</Label>
                            <Input
                                id="edit-trec"
                                value={editTrecId}
                                onChange={(e) => setEditTrecId(e.target.value)}
                                placeholder="Optional"
                            />
                        </div>

                        {/* Role — ADMIN only */}
                        {isAdmin && (
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select value={editRole} onValueChange={setEditRole}>
                                    <SelectTrigger id="edit-role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {r}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingUser(null)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            id="edit-user-save-btn"
                        >
                            {isSaving && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isSaving ? "Saving…" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
