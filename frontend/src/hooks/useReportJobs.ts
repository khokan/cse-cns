"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReportJobs,
  getReportJob,
  requestReport,
  cancelReportJob,
} from "@/services/report.service";
import { REPORT_POLL_INTERVAL_MS } from "@/constants/reportConstants";
import type {
  CreateReportJobPayload,
  ReportJob,
  ReportJobQueryParams,
  ReportMeta,
  ReportStatus,
} from "@/types/report.types";

// Terminal statuses — no more polling needed when all jobs are in these states
const TERMINAL: ReportStatus[] = ["COMPLETED", "FAILED", "CANCELLED"];
const isTerminal = (s: ReportStatus) => TERMINAL.includes(s);

// ---------------------------------------------------------------------------
// Hook: list of report jobs with adaptive polling
// Polls every 3s while any job is PENDING or PROCESSING
// ---------------------------------------------------------------------------
type ReportJobsResult = { data: ReportJob[]; meta: ReportMeta | null };

export const useReportJobs = (params?: ReportJobQueryParams) =>
  useQuery<ReportJobsResult>({
    queryKey: ["report-jobs", params],
    queryFn: async (): Promise<ReportJobsResult> => {
      const res = await getReportJobs(params);
      if (res.error) throw new Error(res.error.message);
      return {
        data: res.data?.data ?? [],
        meta: res.data?.meta ?? null,
      };
    },
    refetchInterval: (query) => {
      const jobs = (query.state.data as ReportJobsResult | undefined)?.data ?? [];
      const hasActive = jobs.some((j) => !isTerminal(j.status));
      return hasActive ? REPORT_POLL_INTERVAL_MS : false;
    },
    staleTime: 10,
  });

// ---------------------------------------------------------------------------
// Hook: single job status (for in-progress polling on the form page)
// ---------------------------------------------------------------------------
export const useReportJob = (id: string | null) =>
  useQuery<ReportJob | null>({
    queryKey: ["report-job", id],
    queryFn: async (): Promise<ReportJob | null> => {
      if (!id) return null;
      const res = await getReportJob(id);
      if (res.error) throw new Error(res.error.message);
      return res.data?.data ?? null;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (!job) return false;
      return isTerminal(job.status) ? false : REPORT_POLL_INTERVAL_MS;
    },
    staleTime: 500,
  });

// ---------------------------------------------------------------------------
// Mutation: request a new report job
// ---------------------------------------------------------------------------
export const useRequestReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReportJobPayload) => {
      const res = await requestReport(payload);
      if (res.error) throw new Error(res.error.message);
      return res.data?.data;
    },
    onSuccess: () => {
      // Refresh the jobs list after a new job is created
      queryClient.invalidateQueries({ queryKey: ["report-jobs"] });
    },
  });
};

// ---------------------------------------------------------------------------
// Mutation: cancel a job
// ---------------------------------------------------------------------------
export const useCancelReportJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await cancelReportJob(id);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-jobs"] });
    },
  });
};

// ---------------------------------------------------------------------------
// Mutation: bulk delete all jobs for ADMIN
// ---------------------------------------------------------------------------
export const useDeleteAllReportJobs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params?: { reportType?: string; status?: string }) => {
      const { deleteAllReportJobs } = await import("@/services/report.service");
      const { data, error } = await deleteAllReportJobs(params);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-jobs"] });
    },
  });
};

// ---------------------------------------------------------------------------
// Hook: fetch members list for selection box
// ---------------------------------------------------------------------------
export const useMembersList = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["report-members-list"],
    queryFn: async () => {
      const { getMembersList } = await import("@/services/report.service");
      const { data, error } = await getMembersList();
      if (error) throw new Error(error.message);
      return data?.data ?? [];
    },
    enabled,
    staleTime: 1 * 60,
  });
