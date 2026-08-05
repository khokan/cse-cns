"use client";

import { apiFetch, buildQueryString, type ApiResult } from "@/lib/api-client";
import type {
  TaxToNBRItem,
  PaginatedTaxToNBRs,
  CreateTaxToNBRPayload,
  UpdateTaxToNBRPayload,
  TaxToNBRQueryParams,
} from "@/types/taxToNBR.types";

export const getAllTaxToNBRs = async (
  params?: TaxToNBRQueryParams
): Promise<ApiResult<PaginatedTaxToNBRs>> => {
  const result = await apiFetch<PaginatedTaxToNBRs>(`/tax-to-nbr${buildQueryString(params)}`);
  
  // Debug logging
  if (process.env.NODE_ENV === "development") {
    console.log("[TaxToNBR Service] getAllTaxToNBRs", {
      params,
      hasError: !!result.error,
      dataCount: result.data?.data?.length,
    });
    
    if (result.data?.data && result.data.data.length > 0) {
      const firstRecord = result.data.data[0];
      console.log("[TaxToNBR Service] First record received:", firstRecord);
      console.log("[TaxToNBR Service] cseCommission:", {
        value: firstRecord.cseCommission,
        type: typeof firstRecord.cseCommission,
        isString: typeof firstRecord.cseCommission === "string",
        isNumber: typeof firstRecord.cseCommission === "number",
      });
      console.log("[TaxToNBR Service] tradeVolume:", {
        value: firstRecord.tradeVolume,
        type: typeof firstRecord.tradeVolume,
      });
      console.log("[TaxToNBR Service] paymentAmount:", {
        value: firstRecord.paymentAmount,
        type: typeof firstRecord.paymentAmount,
      });
    }
  }
  
  return result;
};

export const getTaxToNBRById = async (
  id: string
): Promise<ApiResult<{ data: TaxToNBRItem }>> => {
  const result = await apiFetch<{ data: TaxToNBRItem }>(`/tax-to-nbr/${id}`);
  
  if (process.env.NODE_ENV === "development") {
    console.log("[TaxToNBR Service] getTaxToNBRById", { id, result });
  }
  
  return result;
};

export const createTaxToNBR = async (
  payload: CreateTaxToNBRPayload
): Promise<ApiResult<{ data: TaxToNBRItem }>> => {
  if (process.env.NODE_ENV === "development") {
    console.log("[TaxToNBR Service] createTaxToNBR", { payload });
  }
  
  return apiFetch<{ data: TaxToNBRItem }>(`/tax-to-nbr`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateTaxToNBR = async (
  id: string,
  payload: UpdateTaxToNBRPayload
): Promise<ApiResult<{ data: TaxToNBRItem }>> => {
  if (process.env.NODE_ENV === "development") {
    console.log("[TaxToNBR Service] updateTaxToNBR", { id, payload });
  }
  
  return apiFetch<{ data: TaxToNBRItem }>(`/tax-to-nbr/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteTaxToNBR = async (
  id: string
): Promise<ApiResult<unknown>> => {
  if (process.env.NODE_ENV === "development") {
    console.log("[TaxToNBR Service] deleteTaxToNBR", { id });
  }
  
  return apiFetch(`/tax-to-nbr/${id}`, {
    method: "DELETE",
  });
};

export const bulkDeleteTaxToNBRs = async (ids: string[]): Promise<ApiResult<unknown>> => {
  if (process.env.NODE_ENV === "development") {
    console.log("[TaxToNBR Service] bulkDeleteTaxToNBRs", { ids, count: ids.length });
  }
  
  return apiFetch(`/tax-to-nbr/bulk`, {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
};

export const bulkExportTaxToNBRs = async (
  ids?: string[]
): Promise<Blob> => {
  const response = await fetch(`/api/tax-to-nbr/bulk/export${ids ? buildQueryString({ ids }) : ""}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to export Tax to NBR records");
  }

  return response.blob();
};
