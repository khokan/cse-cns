"use client";

// ---------------------------------------------------------------------------
// Report service — client-side API calls using the shared fetch wrapper.
// ---------------------------------------------------------------------------

import { API_BASE_URL, apiFetch, buildQueryString, type ApiResult } from "@/lib/api-client";
import type {
  CreateReportJobPayload,
  PaginatedReportJobs,
  ReportJob,
  ReportJobQueryParams,
  RequestReportResponse,
} from "@/types/report.types";

// ---------------------------------------------------------------------------
// POST /api/v1/reports/request
// ---------------------------------------------------------------------------
export const requestReport = async (
  payload: CreateReportJobPayload
): Promise<ApiResult<{ data: RequestReportResponse }>> => {
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
): Promise<ApiResult<PaginatedReportJobs>> => {
  return apiFetch(`/reports/jobs${buildQueryString(params)}`);
};

// ---------------------------------------------------------------------------
// GET /api/v1/reports/jobs/:id (single job polling)
// ---------------------------------------------------------------------------
export const getReportJob = async (
  id: string
): Promise<ApiResult<{ data: ReportJob }>> => {
  return apiFetch(`/reports/jobs/${id}`);
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/reports/jobs/:id (cancel/delete single)
// ---------------------------------------------------------------------------
export const cancelReportJob = async (
  id: string
): Promise<ApiResult<unknown>> => {
  return apiFetch(`/reports/jobs/${id}`, { method: "DELETE" });
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/reports/jobs (bulk delete all jobs for ADMIN)
// ---------------------------------------------------------------------------
export const deleteAllReportJobs = async (
  params?: { reportType?: string; status?: string }
): Promise<ApiResult<{ count: number }>> => {
  return apiFetch(`/reports/jobs${buildQueryString(params)}`, { method: "DELETE" });
};

// ---------------------------------------------------------------------------
// GET /api/v1/reports/members (fetch member list for selection UI)
// ---------------------------------------------------------------------------
export interface MemberListItem {
  memberId: string;
  memberCode: string;
  memberName: string;
}

export const getMembersList = async (): Promise<ApiResult<{ data: MemberListItem[] }>> => {
  return apiFetch("/reports/members");
};

// ---------------------------------------------------------------------------
// Download — opens the stream endpoint in a new tab / triggers browser download
// ---------------------------------------------------------------------------
export const downloadReport = (id: string): void => {
  // We open the download URL; the browser handles the file save dialog
  // The cookie is sent automatically since we're in the same origin via proxy
  const url = `${API_BASE_URL}/reports/download/${id}`;
  const a = document.createElement("a");
  a.href = url;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
