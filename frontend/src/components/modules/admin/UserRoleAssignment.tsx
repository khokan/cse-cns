"use client";

import React, { useState } from "react";
import { Plus, X, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role, UserRole } from "@/types/security.types";

interface UserRoleAssignmentProps {
  /** All available roles to choose from */
  allRoles: Role[];
  /** Roles currently assigned to the user */
  userRoles: UserRole[];
  editable?: boolean;
  onSave: (roleIds: string[]) => Promise<void>;
  isSaving?: boolean;
}

export function UserRoleAssignment({
  allRoles,
  userRoles,
  editable = true,
  onSave,
  isSaving = false,
}: UserRoleAssignmentProps) {
  const [assignedIds, setAssignedIds] = useState<string[]>(
    userRoles.map((ur) => ur.roleId)
  );
  const [isDirty, setIsDirty] = useState(false);

  const unassigned = allRoles.filter((r) => !assignedIds.includes(r.id));

  const addRole = (roleId: string) => {
    setAssignedIds((prev) => [...prev, roleId]);
    setIsDirty(true);
  };

  const removeRole = (roleId: string) => {
    setAssignedIds((prev) => prev.filter((id) => id !== roleId));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await onSave(assignedIds);
    setIsDirty(false);
  };

  const assignedRoles = allRoles.filter((r) => assignedIds.includes(r.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Assigned Roles</span>
      </div>

      {/* Current roles as badges */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-lg border bg-muted/30">
        {assignedRoles.length === 0 && (
          <span className="text-sm text-muted-foreground italic">No roles assigned</span>
        )}
        {assignedRoles.map((role) => (
          <Badge
            key={role.id}
            variant="secondary"
            className="flex items-center gap-1 py-1 px-3 text-sm"
          >
            {role.label}
            {role.isSystem && (
              <span className="ml-1 text-xs text-muted-foreground">(system)</span>
            )}
            {editable && (
              <button
                onClick={() => removeRole(role.id)}
                className="ml-1 hover:text-destructive transition-colors"
                aria-label={`Remove ${role.label}`}
                id={`remove-role-${role.id}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Add role dropdown */}
      {editable && unassigned.length > 0 && (
        <div className="flex items-center gap-2">
          <Select onValueChange={addRole}>
            <SelectTrigger
              className="w-[200px]"
              id="add-role-select"
              aria-label="Select a role to add"
            >
              <SelectValue placeholder="Add a role…" />
            </SelectTrigger>
            <SelectContent>
              {unassigned.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.label}
                  {role.isSystem && (
                    <span className="ml-2 text-xs text-muted-foreground">system</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Save button */}
      {editable && isDirty && (
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          id="save-user-roles-btn"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isSaving ? "Saving…" : "Save Role Changes"}
        </Button>
      )}
    </div>
  );
}
