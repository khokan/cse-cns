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
  ReportJobQueryParams,
  ReportStatus,
} from "@/types/report.types";

// Terminal statuses — no more polling needed when all jobs are in these states
const TERMINAL: ReportStatus[] = ["COMPLETED", "FAILED", "CANCELLED"];
const isTerminal = (s: ReportStatus) => TERMINAL.includes(s);

// ---------------------------------------------------------------------------
// Hook: list of report jobs with adaptive polling
// Polls every 3s while any job is PENDING or PROCESSING
// ---------------------------------------------------------------------------
export const useReportJobs = (params?: ReportJobQueryParams) =>
  useQuery({
    queryKey: ["report-jobs", params],
    queryFn: async () => {
      const { data, error } = await getReportJobs(params);
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: (query) => {
      const jobs = query.state.data?.data ?? [];
      const hasActive = jobs.some((j) => !isTerminal(j.status));
      return hasActive ? REPORT_POLL_INTERVAL_MS : false;
    },
    staleTime: 1000,
  });

// ---------------------------------------------------------------------------
// Hook: single job status (for in-progress polling on the form page)
// ---------------------------------------------------------------------------
export const useReportJob = (id: string | null) =>
  useQuery({
    queryKey: ["report-job", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await getReportJob(id);
      if (error) throw new Error(error.message);
      return data?.data ?? null;
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
      const { data, error } = await requestReport(payload);
      if (error) throw new Error(error.message);
      return data?.data;
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
      const { data, error } = await cancelReportJob(id);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-jobs"] });
    },
  });
};
