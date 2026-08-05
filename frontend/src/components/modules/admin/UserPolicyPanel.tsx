"use client";

import React, { useState } from "react";
import { Plus, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  Permission,
  Policy,
  PolicyEffect,
  PolicyEntry,
} from "@/types/security.types";

interface UserPolicyPanelProps {
  /** All available permissions (flat) for the dropdown */
  allPermissions: Permission[];
  /** User's current policy overrides */
  policies: Policy[];
  editable?: boolean;
  onSave: (policies: PolicyEntry[]) => Promise<void>;
  isSaving?: boolean;
}

interface LocalPolicy {
  permissionId: string;
  effect: PolicyEffect;
  reason: string;
}

const EFFECT_COLORS: Record<PolicyEffect, string> = {
  ALLOW: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DENY: "bg-red-100 text-red-800 border-red-200",
};

export function UserPolicyPanel({
  allPermissions,
  policies,
  editable = true,
  onSave,
  isSaving = false,
}: UserPolicyPanelProps) {
  const [localPolicies, setLocalPolicies] = useState<LocalPolicy[]>(
    policies.map((p) => ({
      permissionId: p.permissionId,
      effect: p.effect,
      reason: p.reason ?? "",
    }))
  );
  const [isDirty, setIsDirty] = useState(false);

  const usedPermIds = new Set(localPolicies.map((p) => p.permissionId));
  const available = allPermissions.filter((p) => !usedPermIds.has(p.id));

  const addPolicy = (permissionId: string) => {
    setLocalPolicies((prev) => [
      ...prev,
      { permissionId, effect: "ALLOW", reason: "" },
    ]);
    setIsDirty(true);
  };

  const updatePolicy = <K extends keyof LocalPolicy>(
    idx: number,
    field: K,
    value: LocalPolicy[K]
  ) => {
    setLocalPolicies((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
    setIsDirty(true);
  };

  const removePolicy = (idx: number) => {
    setLocalPolicies((prev) => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  };

  const handleSave = async () => {
    const entries: PolicyEntry[] = localPolicies.map((p) => ({
      permissionId: p.permissionId,
      effect: p.effect,
      reason: p.reason || undefined,
    }));
    await onSave(entries);
    setIsDirty(false);
  };

  const getPermLabel = (id: string) =>
    allPermissions.find((p) => p.id === id)?.label ?? id;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Permission Overrides</span>
        <Badge variant="outline" className="text-xs">
          DENY always wins
        </Badge>
      </div>

      {/* Policy rows */}
      <div className="space-y-2">
        {localPolicies.length === 0 && (
          <p className="text-sm text-muted-foreground italic p-3 border rounded-lg bg-muted/20">
            No policy overrides — user inherits from their roles.
          </p>
        )}

        {localPolicies.map((policy, idx) => (
          <div
            key={`${policy.permissionId}-${idx}`}
            className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-background"
          >
            {/* Permission name */}
            <span className="text-sm font-medium min-w-[160px]">
              {getPermLabel(policy.permissionId)}
            </span>

            {/* Effect toggle */}
            <Select
              value={policy.effect}
              onValueChange={(v) =>
                updatePolicy(idx, "effect", v as PolicyEffect)
              }
              disabled={!editable}
            >
              <SelectTrigger
                className={`w-24 border text-xs font-semibold ${EFFECT_COLORS[policy.effect]}`}
                id={`effect-${idx}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALLOW">ALLOW</SelectItem>
                <SelectItem value="DENY">DENY</SelectItem>
              </SelectContent>
            </Select>

            {/* Admin reason */}
            {editable && (
              <Input
                value={policy.reason}
                onChange={(e) => updatePolicy(idx, "reason", e.target.value)}
                placeholder="Reason (optional)"
                className="text-xs flex-1 min-w-[120px]"
                id={`reason-${idx}`}
              />
            )}
            {!editable && policy.reason && (
              <span className="text-xs text-muted-foreground italic">
                {policy.reason}
              </span>
            )}

            {/* Remove */}
            {editable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => removePolicy(idx)}
                aria-label="Remove policy"
                id={`remove-policy-${idx}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add policy */}
      {editable && available.length > 0 && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Add override:</Label>
          <Select onValueChange={addPolicy}>
            <SelectTrigger
              className="w-[240px] text-xs"
              id="add-policy-select"
              aria-label="Select permission to override"
            >
              <SelectValue placeholder="Select permission…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Save */}
      {editable && isDirty && (
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          id="save-policies-btn"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? "Saving…" : "Save Policy Changes"}
        </Button>
      )}
    </div>
  );
}

