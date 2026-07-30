"use client";

import { apiFetch, buildQueryString, type ApiResult } from "@/lib/api-client";
import type {
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

export const updateUser = async (
  id: string,
  payload: Record<string, unknown>
): Promise<ApiResult<{ data: UserItem }>> => {
  return apiFetch(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteUser = async (
  id: string
): Promise<ApiResult<unknown>> => {
  return apiFetch(`/admin/users/${id}`, {
    method: "DELETE",
  });
};
