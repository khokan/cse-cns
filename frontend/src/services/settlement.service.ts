"use client";

import type {
  CreateSettlementPayload,
  PaginatedSettlements,
  SettlementRecord,
} from "@/types/settlement.types";

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

export const triggerSettlement = async (
  payload: CreateSettlementPayload
): Promise<{ data: any | null; error: { message: string } | null }> => {
  return apiFetch("/settlements/trigger", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getSettlements = async (
  params?: Record<string, any>
): Promise<{ data: PaginatedSettlements | null; error: { message: string } | null }> => {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";

  return apiFetch(`/settlements${qs}`);
};

export const getSettlementByContractNumber = async (
  contractNumber: string
): Promise<{ data: { data: SettlementRecord } | null; error: { message: string } | null }> => {
  return apiFetch(`/settlements/${contractNumber}`);
};

export const retrySettlement = async (
  contractNumber: string
): Promise<{ data: any | null; error: { message: string } | null }> => {
  return apiFetch(`/settlements/${contractNumber}/retry`, {
    method: "POST",
  });
};
