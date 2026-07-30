"use client";

import type {
  AuditLogItem,
  DashboardStats,
  PaginatedAuditLogs,
  UserItem,
} from "@/types/admin.types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: { message: string } | null }> {
  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });

    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: { message: json?.message ?? "Request failed" } };
    }

    return { data: json, error: null };
  } catch {
    return { data: null, error: { message: "Network error. Please try again." } };
  }
}

export const getDashboardStats = async (): Promise<{
  data: { data: DashboardStats } | null;
  error: { message: string } | null;
}> => {
  return apiFetch("/admin/stats");
};

export const getAuditLogs = async (
  params?: Record<string, any>
): Promise<{ data: PaginatedAuditLogs | null; error: { message: string } | null }> => {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";

  return apiFetch(`/admin/audit-logs${qs}`);
};

export const getUsers = async (
  params?: Record<string, any>
): Promise<{ data: { data: UserItem[]; meta: any } | null; error: { message: string } | null }> => {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";

  return apiFetch(`/admin/users${qs}`);
};

export const updateUser = async (
  id: string,
  payload: Record<string, any>
): Promise<{ data: { data: UserItem } | null; error: { message: string } | null }> => {
  return apiFetch(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteUser = async (
  id: string
): Promise<{ data: any | null; error: { message: string } | null }> => {
  return apiFetch(`/admin/users/${id}`, {
    method: "DELETE",
  });
};
