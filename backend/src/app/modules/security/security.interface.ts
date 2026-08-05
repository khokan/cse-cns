// src/app/modules/security/security.interface.ts

import { PolicyEffectType } from "../../types/security.types.js";

// ─── Roles ───────────────────────────────────────────────────────────────────

export interface CreateRoleDto {
    name: string;                  // e.g. "ACCOUNTING"
    label: string;                 // e.g. "Accounting Department"
    description?: string;
}

export interface UpdateRoleDto {
    label?: string;
    description?: string;
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export interface CreatePermissionDto {
    module: string;               // e.g. "invoice"
    action: string;               // "create" | "read" | "update" | "delete"
    label: string;                // e.g. "Create Invoice"
    description?: string;
}

// ─── Role Permissions (permission matrix for a role) ─────────────────────────

/** One entry in the bulk permission matrix update */
export interface RolePermissionEntry {
    permissionId: string;
}

/** PUT /security/roles/:id/permissions body */
export interface UpdateRolePermissionsDto {
    permissions: RolePermissionEntry[];
}

// ─── User Roles ───────────────────────────────────────────────────────────────

/** PUT /security/users/:id/roles body */
export interface UpdateUserRolesDto {
    roleIds: string[];             // Full replacement — not additive
}

// ─── User Policies (per-user overrides) ──────────────────────────────────────

export interface PolicyEntry {
    permissionId: string;
    effect: PolicyEffectType;     // "ALLOW" | "DENY"
    reason?: string;              // admin note
}

/** PUT /security/users/:id/policies body */
export interface UpdateUserPoliciesDto {
    policies: PolicyEntry[];      // Full replacement
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface RoleQuery {
    search?: string;
}

export interface PermissionQuery {
    module?: string;
    search?: string;
}
