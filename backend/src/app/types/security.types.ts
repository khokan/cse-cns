// src/app/types/security.types.ts

/** Policy effect — DENY always overrides ALLOW */
export const PolicyEffect = {
    ALLOW: "ALLOW",
    DENY: "DENY",
} as const;

export type PolicyEffectType = typeof PolicyEffect[keyof typeof PolicyEffect];

/** Valid permission modules */
export const PermissionModule = {
    INVOICE: "invoice",
    SETTLEMENT: "settlement",
    REPORT: "report",
    CHALLAN: "challan",
    RECONCILIATION: "reconciliation",
    TAX_TO_NBR: "taxToNBR",
    ADMIN: "admin",
    DATATABLE: "datatable",
} as const;

export type PermissionModuleType = typeof PermissionModule[keyof typeof PermissionModule];

/** Valid CRUD actions */
export const PermissionAction = {
    CREATE: "create",
    READ: "read",
    UPDATE: "update",
    DELETE: "delete",
} as const;

export type PermissionActionType = typeof PermissionAction[keyof typeof PermissionAction];

/** Result returned by resolvePermission() and attached to req.permission */
export interface PermissionResult {
    allowed: boolean;
    module: string;
    action: string;
}


/** Seeds: default roles to create during migration */
export const DEFAULT_ROLES = [
    { name: "ADMIN", label: "System Administrator", isSystem: true },
    { name: "IT", label: "IT Department", isSystem: true },
    { name: "ACCOUNTING", label: "Accounting Department", isSystem: false },
    { name: "TRECHOLDER", label: "TREC Holder", isSystem: false },
    { name: "MARKETING", label: "Marketing Department", isSystem: false },
] as const;

/** Seeds: default permissions (module × action matrix) */
export const DEFAULT_PERMISSIONS = [
    // Invoice
    { module: "invoice", action: "create", label: "Create Invoice" },
    { module: "invoice", action: "read", label: "Read Invoice" },
    { module: "invoice", action: "update", label: "Edit Invoice" },
    { module: "invoice", action: "delete", label: "Delete Invoice" },
    // Settlement
    { module: "settlement", action: "create", label: "Create Settlement" },
    { module: "settlement", action: "read", label: "Read Settlement" },
    { module: "settlement", action: "update", label: "Edit Settlement" },
    { module: "settlement", action: "delete", label: "Delete Settlement" },
    // Report
    { module: "report", action: "create", label: "Generate Report" },
    { module: "report", action: "read", label: "Read Report" },
    { module: "report", action: "update", label: "Edit Report" },
    { module: "report", action: "delete", label: "Delete Report" },
    // Challan
    { module: "challan", action: "create", label: "Create Challan" },
    { module: "challan", action: "read", label: "Read Challan" },
    { module: "challan", action: "update", label: "Edit Challan" },
    { module: "challan", action: "delete", label: "Delete Challan" },
    // Reconciliation
    { module: "reconciliation", action: "create", label: "Create Reconciliation" },
    { module: "reconciliation", action: "read", label: "Read Reconciliation" },
    { module: "reconciliation", action: "update", label: "Edit Reconciliation" },
    { module: "reconciliation", action: "delete", label: "Delete Reconciliation" },
    // Tax to NBR
    { module: "taxToNBR", action: "create", label: "Submit Tax to NBR" },
    { module: "taxToNBR", action: "read", label: "Read Tax to NBR" },
    { module: "taxToNBR", action: "update", label: "Edit Tax to NBR" },
    { module: "taxToNBR", action: "delete", label: "Delete Tax to NBR" },
    // Admin
    { module: "admin", action: "create", label: "Admin: Create" },
    { module: "admin", action: "read", label: "Admin: Read" },
    { module: "admin", action: "update", label: "Admin: Update" },
    { module: "admin", action: "delete", label: "Admin: Delete" },
    // Datatable
    { module: "datatable", action: "read", label: "Read Datatable" },
] as const;
