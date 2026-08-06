"use client";

import { apiFetch, buildQueryString, type ApiResult } from "@/lib/api-client";
import type {
    CreateUserPayload,
    DashboardStats,
    PaginatedAuditLogs,
    UserItem,
} from "@/types/admin.types";

export const getDashboardStats = async (): Promise<
    ApiResult<{ data: DashboardStats }>
> => {
    return apiFetch("/admin/stats");
};

export const getAuditLogs = async (
    params?: Record<string, unknown>
): Promise<ApiResult<PaginatedAuditLogs>> => {
    return apiFetch(`/admin/audit-logs${buildQueryString(params)}`);
};

export const getUsers = async (
    params?: Record<string, unknown>
): Promise<ApiResult<{ data: UserItem[]; meta: { page: number; limit: number; total: number; totalPages: number } }>> => {
    return apiFetch(`/admin/users${buildQueryString(params)}`);
};

/** Create a new user — available to ADMIN and ACCOUNTING */
export const createUser = async (
    payload: CreateUserPayload
): Promise<ApiResult<{ data: UserItem }>> => {
    return apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/** Update profile fields (name, email, trecHolderId) — ADMIN & ACCOUNTING */
export const updateUser = async (
    id: string,
    payload: Pick<UserItem, "name" | "email"> & { trecHolderId?: string }
): Promise<ApiResult<{ data: UserItem }>> => {
    return apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
};

/** Change role — ADMIN only */
export const updateUserRole = async (
    id: string,
    role: string
): Promise<ApiResult<{ data: UserItem }>> => {
    return apiFetch(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
    });
};

/** Toggle status ACTIVE ↔ INACTIVE — ADMIN & ACCOUNTING */
export const toggleUserStatus = async (
    id: string,
    newStatus: "ACTIVE" | "INACTIVE"
): Promise<ApiResult<{ data: UserItem }>> => {
    return apiFetch(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
    });
};

export const deleteUser = async (
    id: string
): Promise<ApiResult<unknown>> => {
    return apiFetch(`/admin/users/${id}`, {
        method: "DELETE",
    });
};
