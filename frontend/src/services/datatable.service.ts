import { apiFetch, buildQueryString, type ApiResult } from "@/lib/api-client";
import type {
  DatatableQueryParams,
  PaginatedDatatableResult,
  TableConfigItem,
} from "@/types/datatable.types";

export const getAccessibleTables = async (): Promise<
  ApiResult<{ data: TableConfigItem[] }>
> => {
  return apiFetch("/data");
};

export const listRows = async <T = Record<string, unknown>>(
  table: string,
  params?: DatatableQueryParams
): Promise<ApiResult<PaginatedDatatableResult<T>>> => {
  return apiFetch(`/data/${table}${buildQueryString(params)}`);
};

export const getRow = async <T = Record<string, unknown>>(
  table: string,
  id: string
): Promise<ApiResult<{ data: T }>> => {
  return apiFetch(`/data/${table}/${id}`);
};

export const createRow = async <T = Record<string, unknown>>(
  table: string,
  payload: Record<string, unknown>
): Promise<ApiResult<{ data: T }>> => {
  return apiFetch(`/data/${table}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateRow = async <T = Record<string, unknown>>(
  table: string,
  id: string,
  payload: Record<string, unknown>
): Promise<ApiResult<{ data: T }>> => {
  return apiFetch(`/data/${table}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteRow = async (
  table: string,
  id: string
): Promise<ApiResult<unknown>> => {
  return apiFetch(`/data/${table}/${id}`, {
    method: "DELETE",
  });
};
