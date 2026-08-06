export interface AdminUserQuery {
    page?: string;
    limit?: string;
    role?: string;
    status?: string;
    search?: string;
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: string;
    trecHolderId?: string;
}

/** General profile fields — role & status are intentionally excluded */
export interface UpdateUserDto {
    name?: string;
    email?: string;
    trecHolderId?: string;
}

/** ADMIN-only: change a user's system role */
export interface UpdateUserRoleDto {
    role: string;
}

/** ADMIN + ACCOUNTING: toggle between ACTIVE and INACTIVE */
export interface ToggleUserStatusDto {
    status: "ACTIVE" | "INACTIVE";
}

export interface AuditLogQuery {
    page?: string;
    limit?: string;
    action?: string;
    entity?: string;
    userId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}
