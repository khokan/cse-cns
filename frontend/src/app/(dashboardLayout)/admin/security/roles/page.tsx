"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getRoles, createRole, deleteRole } from "@/services/security.service";
import type { Role, CreateRoleDto } from "@/types/security.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Plus,
  Trash2,
  Settings2,
  Search,
  Loader2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateRoleDto>({ name: "", label: "", description: "" });

  const load = async (q?: string) => {
    setIsLoading(true);
    try {
      const res = await getRoles(q);
      if (!res.error) setRoles(res.data?.data ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    load(v);
  };

  const handleCreate = () => {
    startTransition(async () => {
      const res = await createRole(form);
      if (!res.error) {
        toast.success("Role created successfully.");
        setCreateOpen(false);
        setForm({ name: "", label: "", description: "" });
        load();
      } else {
        toast.error(res.error.message ?? "Failed to create role.");
      }
    });
  };

  const handleDelete = (role: Role) => {
    if (role.isSystem) return toast.error("System roles cannot be deleted.");
    if (!confirm(`Delete role "${role.label}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteRole(role.id);
      if (!res.error) {
        toast.success("Role deleted.");
        load();
      } else {
        toast.error(res.error.message ?? "Failed to delete role.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Roles</h1>
            <p className="text-sm text-muted-foreground">
              Manage roles and their permission matrices.
            </p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" id="create-role-btn">
              <Plus className="mr-2 h-4 w-4" /> New Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="role-name">Name (identifier)</Label>
                <Input
                  id="role-name"
                  placeholder="e.g. OPERATIONS"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role-label">Label (display name)</Label>
                <Input
                  id="role-label"
                  placeholder="e.g. Operations Team"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role-desc">Description</Label>
                <Textarea
                  id="role-desc"
                  placeholder="Optional description…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={isPending || !form.name || !form.label}
                className="w-full"
                id="confirm-create-role-btn"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id="role-search"
          placeholder="Search roles…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Roles grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-xl border bg-card p-5 space-y-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{role.label}</span>
                    {role.isSystem && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <code className="text-xs text-muted-foreground">{role.name}</code>
                </div>
                <Badge variant="outline" className="text-xs">
                  {role._count?.userRoles ?? 0} users
                </Badge>
              </div>

              {role.description && (
                <p className="text-xs text-muted-foreground">{role.description}</p>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                {role._count?.permissions ?? 0} permissions
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/admin/security/roles/${role.id}`)}
                  id={`manage-role-${role.id}`}
                >
                  <Settings2 className="mr-1 h-3.5 w-3.5" />
                  Manage
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  disabled={role.isSystem || isPending}
                  onClick={() => handleDelete(role)}
                  aria-label={`Delete ${role.label}`}
                  id={`delete-role-${role.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {roles.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              No roles found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
