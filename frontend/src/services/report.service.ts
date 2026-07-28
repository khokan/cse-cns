"use client";

// ---------------------------------------------------------------------------
// Report service — client-side API calls using fetch with credentials.
// Uses NEXT_PUBLIC_API_BASE_URL as the backend base.
// ---------------------------------------------------------------------------

import type {
  CreateReportJobPayload,
  PaginatedReportJobs,
  ReportJob,
  ReportJobQueryParams,
  RequestReportResponse,
} from "@/types/report.types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

// Generic fetch wrapper with cookie credentials
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

// ---------------------------------------------------------------------------
// POST /api/v1/reports/request
// ---------------------------------------------------------------------------
export const requestReport = async (
  payload: CreateReportJobPayload
): Promise<{ data: { data: RequestReportResponse } | null; error: { message: string } | null }> => {
  return apiFetch("/reports/request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// ---------------------------------------------------------------------------
// GET /api/v1/reports/jobs (paginated)
// ---------------------------------------------------------------------------
export const getReportJobs = async (
  params?: ReportJobQueryParams
): Promise<{ data: PaginatedReportJobs | null; error: { message: string } | null }> => {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";

  return apiFetch(`/reports/jobs${qs}`);
};

// ---------------------------------------------------------------------------
// GET /api/v1/reports/jobs/:id (single job polling)
// ---------------------------------------------------------------------------
export const getReportJob = async (
  id: string
): Promise<{ data: { data: ReportJob } | null; error: { message: string } | null }> => {
  return apiFetch(`/reports/jobs/${id}`);
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/reports/jobs/:id (cancel/delete single)
// ---------------------------------------------------------------------------
export const cancelReportJob = async (
  id: string
): Promise<{ data: unknown | null; error: { message: string } | null }> => {
  return apiFetch(`/reports/jobs/${id}`, { method: "DELETE" });
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/reports/jobs (bulk delete all jobs for ADMIN)
// ---------------------------------------------------------------------------
export const deleteAllReportJobs = async (
  params?: { reportType?: string; status?: string }
): Promise<{ data: { count: number } | null; error: { message: string } | null }> => {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";

  return apiFetch(`/reports/jobs${qs}`, { method: "DELETE" });
};

// ---------------------------------------------------------------------------
// Download — opens the stream endpoint in a new tab / triggers browser download
// ---------------------------------------------------------------------------
export const downloadReport = (id: string): void => {
  // We open the download URL; the browser handles the file save dialog
  // The cookie is sent automatically since we're in the same origin via proxy
  const url = `${API}/reports/download/${id}`;
  const a = document.createElement("a");
  a.href = url;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
