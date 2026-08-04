"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllTaxToNBRs,
  getTaxToNBRById,
  createTaxToNBR,
  updateTaxToNBR,
  deleteTaxToNBR,
  bulkDeleteTaxToNBRs,
  bulkExportTaxToNBRs,
} from "@/services/taxToNBR.service";
import type {
  TaxToNBRItem,
  PaginatedTaxToNBRs,
  CreateTaxToNBRPayload,
  UpdateTaxToNBRPayload,
  TaxToNBRQueryParams,
} from "@/types/taxToNBR.types";

const TAX_TO_NBRS_KEY = ["taxToNBRs"];
const taxToNBRsListKey = (params?: TaxToNBRQueryParams) => [
  "taxToNBRs",
  "list",
  params ?? {},
];
const taxToNBRKey = (id: string) => ["taxToNBRs", "detail", id];

// Query hooks
export const useTaxToNBRs = (params?: TaxToNBRQueryParams) =>
  useQuery<PaginatedTaxToNBRs>({
    queryKey: taxToNBRsListKey(params),
    queryFn: async () => {
      const res = await getAllTaxToNBRs(params);
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
  });

export const useTaxToNBR = (id: string | null) =>
  useQuery<TaxToNBRItem>({
    queryKey: taxToNBRKey(id!),
    queryFn: async () => {
      const res = await getTaxToNBRById(id!);
      if (res.error) throw new Error(res.error.message);
      return res.data!.data;
    },
    enabled: !!id,
  });

// Mutation hooks
export const useCreateTaxToNBR = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTaxToNBRPayload) => {
      const res = await createTaxToNBR(payload);
      if (res.error) throw new Error(res.error.message);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_TO_NBRS_KEY });
      toast.success("Tax to NBR record created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create Tax to NBR record");
    },
  });
};

export const useUpdateTaxToNBR = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateTaxToNBRPayload) => {
      const res = await updateTaxToNBR(id, payload);
      if (res.error) throw new Error(res.error.message);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_TO_NBRS_KEY });
      queryClient.invalidateQueries({ queryKey: taxToNBRKey(id) });
      toast.success("Tax to NBR record updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update Tax to NBR record");
    },
  });
};

export const useDeleteTaxToNBR = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteTaxToNBR(id);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_TO_NBRS_KEY });
      toast.success("Tax to NBR record deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete Tax to NBR record");
    },
  });
};

export const useBulkDeleteTaxToNBRs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await bulkDeleteTaxToNBRs(ids);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_TO_NBRS_KEY });
      toast.success("Tax to NBR records deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete Tax to NBR records");
    },
  });
};

export const useBulkExportTaxToNBRs = () => {
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      return await bulkExportTaxToNBRs(ids);
    },
    onSuccess: () => {
      toast.success("Export successful");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export Tax to NBR records");
    },
  });
};
