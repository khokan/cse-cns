"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Save, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  Permission,
  PermissionMatrixRow,
  RolePermissionEntry,
} from "@/types/security.types";
import { PERMISSION_ACTIONS } from "@/types/security.types";

interface RolePermissionMatrixProps {
  /** All available permissions (flat list from API) */
  permissions: Permission[];
  /** Currently granted role permissions */
  rolePermissions: { permissionId: string }[];
  /** Whether ADMIN can edit — read-only for non-admin viewers */
  editable?: boolean;
  /** Callback with the full new permission set on save */
  onSave: (entries: RolePermissionEntry[]) => Promise<void>;
  isSaving?: boolean;
}

/** Build a per-module matrix row from flat permission + granted lists */
function buildMatrix(
  permissions: Permission[],
  granted: { permissionId: string }[]
): PermissionMatrixRow[] {
  const grantedSet = new Set(granted.map((g) => g.permissionId));

  // Group all permissions by module
  const moduleMap = new Map<string, Permission[]>();
  for (const perm of permissions) {
    if (!moduleMap.has(perm.module)) moduleMap.set(perm.module, []);
    moduleMap.get(perm.module)!.push(perm);
  }

  const rows: PermissionMatrixRow[] = [];
  for (const [module, perms] of moduleMap.entries()) {
    const permIds: Record<string, string | undefined> = {};
    for (const p of perms) permIds[p.action] = p.id;

    rows.push({
      module,
      create: grantedSet.has(permIds["create"] ?? ""),
      read: grantedSet.has(permIds["read"] ?? ""),
      update: grantedSet.has(permIds["update"] ?? ""),
      delete: grantedSet.has(permIds["delete"] ?? ""),
      permissionIds: {
        create: permIds["create"],
        read: permIds["read"],
        update: permIds["update"],
        delete: permIds["delete"],
      },
    });
  }

  return rows.sort((a, b) => a.module.localeCompare(b.module));
}

/** Convert matrix rows back to RolePermissionEntry[] for the API */
function matrixToEntries(rows: PermissionMatrixRow[]): RolePermissionEntry[] {
  const entries: RolePermissionEntry[] = [];
  for (const row of rows) {
    for (const action of PERMISSION_ACTIONS) {
      if (row[action]) {
        const permId = row.permissionIds[action];
        if (permId) entries.push({ permissionId: permId });
      }
    }
  }
  return entries;
}

const MODULE_LABELS: Record<string, string> = {
  invoice: "Invoice",
  settlement: "Settlement",
  report: "Report",
  challan: "Challan",
  reconciliation: "Reconciliation",
  taxToNBR: "Tax to NBR",
  admin: "Admin",
  datatable: "Datatable",
};

export function RolePermissionMatrix({
  permissions,
  rolePermissions,
  editable = true,
  onSave,
  isSaving = false,
}: RolePermissionMatrixProps) {
  const [rows, setRows] = useState<PermissionMatrixRow[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setRows(buildMatrix(permissions, rolePermissions));
    setIsDirty(false);
  }, [permissions, rolePermissions]);

  const toggleAction = useCallback(
    (module: string, action: "create" | "read" | "update" | "delete") => {
      if (!editable) return;
      setRows((prev) =>
        prev.map((r) =>
          r.module === module ? { ...r, [action]: !r[action] } : r
        )
      );
      setIsDirty(true);
    },
    [editable]
  );

  const handleSave = async () => {
    await onSave(matrixToEntries(rows));
    setIsDirty(false);
  };

  const hasAnyAction = (row: PermissionMatrixRow) =>
    row.create || row.read || row.update || row.delete;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Toggle actions for each module to grant or revoke permissions.</span>
        </div>
        {editable && (
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        )}
      </div>

      {/* Matrix Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">
                Module
              </th>
              {PERMISSION_ACTIONS.map((action) => (
                <th
                  key={action}
                  className="text-center px-3 py-3 font-medium text-muted-foreground capitalize w-24"
                >
                  {action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.module}
                className={`border-b last:border-0 transition-colors ${
                  hasAnyAction(row) ? "bg-background" : "bg-muted/20"
                } hover:bg-accent/30`}
              >
                {/* Module name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {MODULE_LABELS[row.module] ?? row.module}
                    </span>
                    {hasAnyAction(row) && (
                      <Badge variant="secondary" className="text-xs h-4 px-1">
                        active
                      </Badge>
                    )}
                  </div>
                </td>

                {/* Action checkboxes */}
                {PERMISSION_ACTIONS.map((action) => {
                  const hasPermission = !!row.permissionIds[action];
                  return (
                    <td key={action} className="text-center px-3 py-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <input
                                type="checkbox"
                                checked={row[action]}
                                disabled={!editable || !hasPermission}
                                onChange={() =>
                                  hasPermission &&
                                  toggleAction(
                                    row.module,
                                    action as "create" | "read" | "update" | "delete"
                                  )
                                }
                                className="h-4 w-4 rounded border-input accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`${row.module} ${action}`}
                                id={`matrix-${idx}-${action}`}
                              />
                            </span>
                          </TooltipTrigger>
                          {!hasPermission && (
                            <TooltipContent>
                              <p>No &apos;{action}&apos; permission defined for {row.module}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No permissions defined yet.
          </div>
        )}
      </div>
    </div>
  );
}

