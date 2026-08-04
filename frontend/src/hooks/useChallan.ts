"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllChallans,
  getChallanById,
  createChallan,
  updateChallan,
  deleteChallan,
  bulkDeleteChallans,
  bulkExportChallans,
} from "@/services/challan.service";
import type {
  ChallanItem,
  PaginatedChallans,
  CreateChallanPayload,
  UpdateChallanPayload,
  ChallanQueryParams,
} from "@/types/challan.types";

const CHALLANS_KEY = ["challans"];
const challansListKey = (params?: ChallanQueryParams) => [
  "challans",
  "list",
  params ?? {},
];
const challanKey = (id: number) => ["challans", "detail", id];

// Query hooks
export const useChallans = (params?: ChallanQueryParams) =>
  useQuery<PaginatedChallans>({
    queryKey: challansListKey(params),
    queryFn: async () => {
      const res = await getAllChallans(params);
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
  });

export const useChallan = (id: number | null) =>
  useQuery<ChallanItem>({
    queryKey: challanKey(id!),
    queryFn: async () => {
      const res = await getChallanById(id!);
      if (res.error) throw new Error(res.error.message);
      return res.data!.data;
    },
    enabled: !!id,
  });

// Mutation hooks
export const useCreateChallan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateChallanPayload) => {
      const res = await createChallan(payload);
      if (res.error) throw new Error(res.error.message);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHALLANS_KEY });
      toast.success("Challan created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create challan");
    },
  });
};

export const useUpdateChallan = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateChallanPayload) => {
      const res = await updateChallan(id, payload);
      if (res.error) throw new Error(res.error.message);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHALLANS_KEY });
      queryClient.invalidateQueries({ queryKey: challanKey(id) });
      toast.success("Challan updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update challan");
    },
  });
};

export const useDeleteChallan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await deleteChallan(id);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHALLANS_KEY });
      toast.success("Challan deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete challan");
    },
  });
};

export const useBulkDeleteChallans = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await bulkDeleteChallans(ids);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHALLANS_KEY });
      toast.success("Challans deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete challans");
    },
  });
};

export const useBulkExportChallans = () => {
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      return await bulkExportChallans(ids);
    },
    onSuccess: () => {
      toast.success("Export successful");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export challans");
    },
  });
};
