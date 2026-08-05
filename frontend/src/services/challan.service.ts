"use client";

import { apiFetch, buildQueryString, type ApiResult } from "@/lib/api-client";
import type {
  ChallanItem,
  PaginatedChallans,
  CreateChallanPayload,
  UpdateChallanPayload,
  ChallanQueryParams,
} from "@/types/challan.types";

export const getAllChallans = async (
  params?: ChallanQueryParams
): Promise<ApiResult<PaginatedChallans>> => {
  return apiFetch(`/challans${buildQueryString(params)}`);
};

export const getChallanById = async (
  id: number
): Promise<ApiResult<{ data: ChallanItem }>> => {
  return apiFetch(`/challans/${id}`);
};

export const createChallan = async (
  payload: CreateChallanPayload
): Promise<ApiResult<{ data: ChallanItem }>> => {
  return apiFetch(`/challans`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateChallan = async (
  id: number,
  payload: UpdateChallanPayload
): Promise<ApiResult<{ data: ChallanItem }>> => {
  return apiFetch(`/challans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteChallan = async (
  id: number
): Promise<ApiResult<unknown>> => {
  return apiFetch(`/challans/${id}`, {
    method: "DELETE",
  });
};

export const bulkDeleteChallans = async (ids: string[]): Promise<ApiResult<unknown>> => {
  return apiFetch(`/challans/bulk`, {
    method: "DELETE",
    body: JSON.stringify({ ids: ids.map(Number) }),
  });
};

export const bulkExportChallans = async (
  ids?: string[]
): Promise<Blob> => {
  const response = await fetch(`/api/challans/bulk/export${ids ? buildQueryString({ ids }) : ""}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to export challans");
  }

  return response.blob();
};
