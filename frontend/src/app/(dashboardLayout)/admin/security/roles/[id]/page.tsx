"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MY_PERMISSIONS_KEY } from "@/hooks/useMyPermissions";
import { useParams, useRouter } from "next/navigation";
import {
  getRole,
  getPermissions,
  getRolePermissions,
  updateRolePermissions,
  updateRole,
} from "@/services/security.service";
import type {
  Role,
  RolePermission,
  Permission,
  RolePermissionEntry,
  UpdateRoleDto,
} from "@/types/security.types";
import { RolePermissionMatrix } from "@/components/modules/admin/RolePermissionMatrix";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Shield,
  Loader2,
  Lock,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [role, setRole] = useState<Role | null>(null);
  const [rolePerms, setRolePerms] = useState<RolePermission[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  // Inline edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateRoleDto>({ label: "", description: "" });

  const load = async () => {
    setIsLoading(true);
    try {
      const [roleRes, permsRes, rpRes] = await Promise.all([
        getRole(id),
        getPermissions(),
        getRolePermissions(id),
      ]);
      if (!roleRes.error) {
        const r = roleRes.data?.data as Role;
        setRole(r);
        setEditForm({ label: r.label, description: r.description ?? "" });
      }
      if (!permsRes.error) setAllPerms(permsRes.data?.data?.flat ?? []);
      if (!rpRes.error) setRolePerms(rpRes.data?.data ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveMatrix = async (entries: RolePermissionEntry[]) => {
    setIsSaving(true);
    try {
      const res = await updateRolePermissions(id, { permissions: entries });
      if (!res.error) {
        toast.success("Permission matrix updated.");
        const rpRes = await getRolePermissions(id);
        if (!rpRes.error) setRolePerms(rpRes.data?.data ?? []);
        // Invalidate my-permissions cache so all users see fresh permissions instantly
        await queryClient.invalidateQueries({ queryKey: MY_PERMISSIONS_KEY });
      } else {
        toast.error(res.error.message ?? "Failed to update permissions.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLabel = () => {
    startTransition(async () => {
      const res = await updateRole(id, editForm);
      if (!res.error) {
        toast.success("Role updated.");
        setRole((prev) => prev ? { ...prev, ...editForm } : prev);
        setEditing(false);
      } else {
        toast.error(res.error.message ?? "Failed to update role.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!role) return <div className="text-muted-foreground p-8">Role not found.</div>;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        id="back-btn"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Roles
      </Button>

      {/* Role header */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              {editing ? (
                <div className="space-y-2">
                  <Input
                    id="edit-role-label"
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="text-lg font-bold h-9"
                    placeholder="Role display name"
                  />
                  <Textarea
                    id="edit-role-desc"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Description…"
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveLabel} disabled={isPending} id="confirm-edit-role-btn">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)} id="cancel-edit-role-btn">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{role.label}</h1>
                    {role.isSystem && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <code className="text-sm text-muted-foreground">{role.name}</code>
                  {role.description && (
                    <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary">{rolePerms.length} permissions</Badge>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                disabled={role.isSystem}
                id="edit-role-info-btn"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Permission Matrix</h2>
          <p className="text-sm text-muted-foreground">
            Check actions for each module. Click &ldquo;Save Changes&rdquo; to apply.
          </p>
        </div>

        <RolePermissionMatrix
          permissions={allPerms}
          rolePermissions={rolePerms.map((rp) => ({
            permissionId: rp.permissionId,
          }))}
          editable={true}
          onSave={handleSaveMatrix}
          isSaving={isSaving}
        />
      </div>

    </div>
  );
}
