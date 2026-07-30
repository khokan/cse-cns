"use client";

import type {
  DatatableQueryParams,
  PaginatedDatatableResult,
  TableConfigItem,
} from "@/types/datatable.types";

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

export const getAccessibleTables = async (): Promise<{
  data: { data: TableConfigItem[] } | null;
  error: { message: string } | null;
}> => {
  return apiFetch("/data");
};

export const listRows = async <T = Record<string, any>>(
  table: string,
  params?: DatatableQueryParams
): Promise<{ data: PaginatedDatatableResult<T> | null; error: { message: string } | null }> => {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";

  return apiFetch(`/data/${table}${qs}`);
};

export const getRow = async <T = Record<string, any>>(
  table: string,
  id: string
): Promise<{ data: { data: T } | null; error: { message: string } | null }> => {
  return apiFetch(`/data/${table}/${id}`);
};

export const createRow = async <T = Record<string, any>>(
  table: string,
  payload: Record<string, any>
): Promise<{ data: { data: T } | null; error: { message: string } | null }> => {
  return apiFetch(`/data/${table}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateRow = async <T = Record<string, any>>(
  table: string,
  id: string,
  payload: Record<string, any>
): Promise<{ data: { data: T } | null; error: { message: string } | null }> => {
  return apiFetch(`/data/${table}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteRow = async (
  table: string,
  id: string
): Promise<{ data: any | null; error: { message: string } | null }> => {
  return apiFetch(`/data/${table}/${id}`, {
    method: "DELETE",
  });
};
