"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAccessibleTables,
  listRows,
  getRow,
  createRow,
  updateRow,
  deleteRow,
} from "@/services/datatable.service";
import type { DatatableQueryParams, TableConfigItem } from "@/types/datatable.types";

const TABLES_KEY = ["datatable", "tables"];
const rowsKey = (table: string, params?: DatatableQueryParams) => [
  "datatable",
  "rows",
  table,
  params ?? {},
];
const rowKey = (table: string, id: string) => ["datatable", "row", table, id];

export const useAccessibleTables = () =>
  useQuery<TableConfigItem[]>({
    queryKey: TABLES_KEY,
    queryFn: async () => {
      const res = await getAccessibleTables();
      if (res.error) throw new Error(res.error.message);
      return res.data?.data ?? [];
    },
  });

export const useDatatableRows = <T = Record<string, unknown>>(
  table: string,
  params?: DatatableQueryParams
) =>
  useQuery<{ data: T[]; meta: { page: number; limit: number; total: number; totalPages: number; primaryKey: string; canWrite: boolean } }>({
    queryKey: rowsKey(table, params),
    queryFn: async () => {
      const res = await listRows<T>(table, params);
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
    enabled: !!table,
  });

export const useDatatableRow = <T = Record<string, unknown>>(table: string, id: string) =>
  useQuery<T>({
    queryKey: rowKey(table, id),
    queryFn: async () => {
      const res = await getRow<T>(table, id);
      if (res.error) throw new Error(res.error.message);
      return res.data?.data ?? ({} as T);
    },
    enabled: !!table && !!id,
  });

export const useCreateRow = (table: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await createRow(table, payload);
      if (res.error) throw new Error(res.error.message);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datatable", "rows", table] });
      toast.success("Row created successfully.");
    },
    onError: (err: Error) => toast.error("Failed to create row", { description: err.message }),
  });
};

export const useUpdateRow = (table: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    Error,
    { id: string; payload: Record<string, unknown> }
  >({
    mutationFn: async ({ id, payload }) => {
      const res = await updateRow(table, id, payload);
      if (res.error) throw new Error(res.error.message);
      return res.data?.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["datatable", "rows", table] });
      queryClient.invalidateQueries({ queryKey: rowKey(table, id) });
      toast.success("Row updated successfully.");
    },
    onError: (err: Error) => toast.error("Failed to update row", { description: err.message }),
  });
};

export const useDeleteRow = (table: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteRow(table, id);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datatable", "rows", table] });
      toast.success("Row deleted successfully.");
    },
    onError: (err: Error) => toast.error("Failed to delete row", { description: err.message }),
  });
};
