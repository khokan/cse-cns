"use client";

// ---------------------------------------------------------------------------
// Reconciliation service — client-side API call using fetch with credentials.
// Uses NEXT_PUBLIC_API_BASE_URL as the backend base.
// ---------------------------------------------------------------------------

import { logger } from "@/utils/logger";
import type { ReconciliationSummary } from "@/types/reconciliation.types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

type ApiResult<T> = { data: T | null; error: { message: string } | null };

// ---------------------------------------------------------------------------
// GET /api/v1/reconciliation/summary?date=YYYY-MM-DD
// Defaults to 2024-06-02 (sample dataset date) on the backend when omitted.
// ---------------------------------------------------------------------------
export const getReconciliationSummary = async (
  date?: string
): Promise<ApiResult<{ data: ReconciliationSummary }>> => {
  try {
    const qs = date ? `?date=${encodeURIComponent(date)}` : "";
    const res = await fetch(`${API}/reconciliation/summary${qs}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      const message = json?.message ?? "Failed to fetch reconciliation summary.";
      logger.error("Reconciliation summary request failed", {
        status: res.status,
        message,
      });
      return { data: null, error: { message } };
    }

    return { data: json, error: null };
  } catch (error) {
    logger.error("Network error fetching reconciliation summary", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      data: null,
      error: { message: "Network error. Please try again." },
    };
  }
};
