"use client";

import { useQuery } from "@tanstack/react-query";
import { getReconciliationSummary } from "@/services/reconciliation.service";
import type { ReconciliationSummary } from "@/types/reconciliation.types";

// ---------------------------------------------------------------------------
// Hook: useReconciliationSummary
// Fetches the aggregated reconciliation dashboard data (ADMIN/IT only).
// Optionally accepts a settlement `date` (YYYY-MM-DD); defaults server-side
// to 2024-06-02 (the sample dataset date) when omitted.
// ---------------------------------------------------------------------------
export const useReconciliationSummary = (date?: string) =>
  useQuery<ReconciliationSummary>({
    queryKey: ["reconciliation-summary", date ?? "default"],
    queryFn: async (): Promise<ReconciliationSummary> => {
      const res = await getReconciliationSummary(date);
      if (res.error) throw new Error(res.error.message);
      if (!res.data?.data) throw new Error("No reconciliation data returned.");
      return res.data.data;
    },
    staleTime: 6000,
    retry: 1,
  });
