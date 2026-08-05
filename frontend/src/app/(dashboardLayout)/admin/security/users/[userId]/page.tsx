"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getRoles,
  getPermissions,
  getUserRoles,
  updateUserRoles,
  getUserPolicies,
  updateUserPolicies,
} from "@/services/security.service";
import type {
  Role,
  Permission,
  UserRole,
  Policy,
  RolePermissionEntry,
  PolicyEntry,
} from "@/types/security.types";
import { UserRoleAssignment } from "@/components/modules/admin/UserRoleAssignment";
import { UserPolicyPanel } from "@/components/modules/admin/UserPolicyPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Users, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function UserSecurityPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes, urRes, polRes] = await Promise.all([
        getRoles(),
        getPermissions(),
        getUserRoles(userId),
        getUserPolicies(userId),
      ]);
      if (!rolesRes.error) setAllRoles(rolesRes.data?.data ?? []);
      if (!permsRes.error) setAllPerms(permsRes.data?.data?.flat ?? []);
      if (!urRes.error) setUserRoles(urRes.data?.data ?? []);
      if (!polRes.error) setPolicies(polRes.data?.data ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  const handleSaveRoles = async (roleIds: string[]) => {
    setIsSavingRoles(true);
    try {
      const res = await updateUserRoles(userId, { roleIds });
      if (!res.error) {
        toast.success("User roles updated.");
        const urRes = await getUserRoles(userId);
        if (!urRes.error) setUserRoles(urRes.data?.data ?? []);
      } else {
        toast.error(res.error.message ?? "Failed to update roles.");
      }
    } finally {
      setIsSavingRoles(false);
    }
  };

  const handleSavePolicies = async (newPolicies: PolicyEntry[]) => {
    setIsSavingPolicies(true);
    try {
      const res = await updateUserPolicies(userId, { policies: newPolicies });
      if (!res.error) {
        toast.success("User policies updated.");
        const polRes = await getUserPolicies(userId);
        if (!polRes.error) setPolicies(polRes.data?.data ?? []);
      } else {
        toast.error(res.error.message ?? "Failed to update policies.");
      }
    } finally {
      setIsSavingPolicies(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} id="back-btn">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div>
        <h1 className="text-xl font-bold">User Security Settings</h1>
        <p className="text-sm text-muted-foreground">
          Assign roles and configure per-user permission overrides.
        </p>
      </div>

      {/* Roles Section */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Role Assignment</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          This user inherits all permissions from their assigned roles. Permissions are merged
          (widest scope wins across roles).
        </p>
        <UserRoleAssignment
          allRoles={allRoles}
          userRoles={userRoles}
          editable={true}
          onSave={handleSaveRoles}
          isSaving={isSavingRoles}
        />
      </div>

      {/* Policies Section */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Policy Overrides</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Override specific permissions for this user. <strong>DENY always wins</strong> — even if
          a role grants the permission.
        </p>
        <UserPolicyPanel
          allPermissions={allPerms}
          policies={policies}
          editable={true}
          onSave={handleSavePolicies}
          isSaving={isSavingPolicies}
        />
      </div>
    </div>
  );
}
