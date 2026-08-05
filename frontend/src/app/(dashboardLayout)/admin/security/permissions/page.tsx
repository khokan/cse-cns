"use client";

import React, { useEffect, useState } from "react";
import { getPermissions } from "@/services/security.service";
import type { Permission } from "@/types/security.types";
import { PERMISSION_ACTIONS } from "@/types/security.types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Search, Loader2 } from "lucide-react";

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

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700 border-emerald-200",
  read: "bg-blue-100 text-blue-700 border-blue-200",
  update: "bg-amber-100 text-amber-700 border-amber-200",
  delete: "bg-red-100 text-red-700 border-red-200",
};

export default function PermissionsPage() {
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = async (q?: string) => {
    setIsLoading(true);
    try {
      const res = await getPermissions(q ? { search: q } : undefined);
      if (!res.error) setGrouped(res.data?.data?.grouped ?? {});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalCount = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Permissions</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} permissions across {Object.keys(grouped).length} modules.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id="permission-search"
          placeholder="Search permissions…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
          className="pl-9"
        />
      </div>

      {/* Permissions grouped by module */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module} className="rounded-xl border bg-card overflow-hidden">
              {/* Module header */}
              <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b">
                <span className="font-semibold">{MODULE_LABELS[module] ?? module}</span>
                <Badge variant="outline" className="text-xs">{perms.length}</Badge>
              </div>

              {/* Permission rows */}
              <div className="divide-y">
                {PERMISSION_ACTIONS.filter((a) => perms.some((p) => p.action === a)).map((action) => {
                  const perm = perms.find((p) => p.action === action);
                  if (!perm) return null;
                  return (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between px-5 py-3 hover:bg-accent/20 transition-colors"
                      id={`perm-${module}-${action}`}
                    >
                      <div>
                        <p className="text-sm font-medium">{perm.label}</p>
                        {perm.description && (
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        )}
                      </div>
                      <Badge
                        className={`text-xs capitalize border ${ACTION_COLORS[action]}`}
                        variant="outline"
                      >
                        {action}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              No permissions found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
