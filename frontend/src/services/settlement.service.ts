"use client";

import { apiFetch, buildQueryString, type ApiResult } from "@/lib/api-client";
import type {
  CreateSettlementPayload,
  PaginatedSettlements,
  SettlementRecord,
} from "@/types/settlement.types";

export const triggerSettlement = async (
  payload: CreateSettlementPayload
): Promise<ApiResult<unknown>> => {
  return apiFetch("/settlements/trigger", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getSettlements = async (
  params?: Record<string, unknown>
): Promise<ApiResult<PaginatedSettlements>> => {
  return apiFetch(`/settlements${buildQueryString(params)}`);
};

export const getSettlementByContractNumber = async (
  contractNumber: string
): Promise<ApiResult<{ data: SettlementRecord }>> => {
  return apiFetch(`/settlements/${contractNumber}`);
};

export const retrySettlement = async (
  contractNumber: string
): Promise<ApiResult<unknown>> => {
  return apiFetch(`/settlements/${contractNumber}/retry`, {
    method: "POST",
  });
};
