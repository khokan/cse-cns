"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUser, deleteUser } from "@/services/admin.service";
import { TanstackDataTable } from "@/components/modules/common/tanstack-data-table";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { UserItem } from "@/types/admin.types";

const ROLE_OPTIONS = ["ADMIN", "IT", "ACCOUNTING", "TRECHOLDER"];
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED"];

const columns: ColumnDef<UserItem>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant={row.original.role === "ADMIN" ? "destructive" : "secondary"}>
        {row.original.role}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <span className="text-xs capitalize">{String(getValue()).toLowerCase()}</span>
    ),
  },
  {
    accessorKey: "emailVerified",
    header: "Verified",
    cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
  },
];

export function AdminUsersManager() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await getUsers();
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditingUser(null);
      toast.success("User updated.");
    },
    onError: (err: Error) => toast.error("Failed to update user", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted.");
    },
    onError: (err: Error) => toast.error("Failed to delete user", { description: err.message }),
  });

  const openEdit = (user: UserItem) => {
    setEditingUser(user);
    setRole(user.role);
    setStatus(user.status);
  };

  const handleSave = () => {
    if (!editingUser) return;
    updateMutation.mutate({
      id: editingUser.id,
      payload: { role, status },
    });
  };

  const handleDelete = (user: UserItem) => {
    if (window.confirm(`Delete user ${user.name ?? user.email}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  return (
    <div className="space-y-4">
      <TanstackDataTable
        columns={columns}
        data={data?.data ?? []}
        searchKeys={["name", "email", "role"]}
        noDataText={isLoading ? "Loading users..." : "No users found."}
        renderRowActions={(user) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update role and status for {editingUser?.email}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
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
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
