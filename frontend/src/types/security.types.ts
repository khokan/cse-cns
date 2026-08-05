// src/types/security.types.ts

export type PolicyEffect = "ALLOW" | "DENY";
export type PermissionAction = "create" | "read" | "update" | "delete";

// ─── Core entities ────────────────────────────────────────────────────────────

export interface Role {
    id: string;
    name: string;
    label: string;
    description: string | null;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        permissions: number;
        userRoles: number;
    };
}

export interface Permission {
    id: string;
    module: string;
    action: string;
    label: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface RolePermission {
    id: string;
    roleId: string;
    permissionId: string;
    permission: Permission;
    createdAt: string;
    updatedAt: string;
}

export interface UserRole {
    id: string;
    userId: string;
    roleId: string;
    role: Role & { _count: { permissions: number } };
    createdAt: string;
}

export interface Policy {
    id: string;
    userId: string;
    permissionId: string;
    effect: PolicyEffect;
    reason: string | null;
    permission: Permission;
    createdAt: string;
    updatedAt: string;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface PermissionsGrouped {
    flat: Permission[];
    grouped: Record<string, Permission[]>;
}

// ─── DTOs (sent to API) ───────────────────────────────────────────────────────

export interface CreateRoleDto {
    name: string;
    label: string;
    description?: string;
}

export interface UpdateRoleDto {
    label?: string;
    description?: string;
}

export interface RolePermissionEntry {
    permissionId: string;
}

export interface UpdateRolePermissionsDto {
    permissions: RolePermissionEntry[];
}

export interface UpdateUserRolesDto {
    roleIds: string[];
}

export interface PolicyEntry {
    permissionId: string;
    effect: PolicyEffect;
    reason?: string;
}

export interface UpdateUserPoliciesDto {
    policies: PolicyEntry[];
}

// ─── Permission matrix UI helper ──────────────────────────────────────────────

/** A row in the RolePermissionMatrix component */
export interface PermissionMatrixRow {
    module: string;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    // Raw permission IDs for each action
    permissionIds: Record<PermissionAction, string | undefined>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PERMISSION_MODULES = [
    "invoice",
    "settlement",
    "report",
    "challan",
    "reconciliation",
    "taxToNBR",
    "admin",
    "datatable",
] as const;

export const PERMISSION_ACTIONS: PermissionAction[] = ["create", "read", "update", "delete"];

