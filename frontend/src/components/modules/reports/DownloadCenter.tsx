"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  RefreshCw,
  Inbox,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { JobProgressCard } from "./JobProgressCard";
import { useReportJobs, useDeleteAllReportJobs } from "@/hooks/useReportJobs";
import { useJobStatus } from "@/hooks/useJobStatus";
import type { ReportStatus } from "@/types/report.types";
import { cn } from "@/utils/utils";
import { toast } from "sonner";

// Status filter tabs
const STATUS_TABS: { label: string; value: ReportStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
];

interface DownloadCenterProps {
  userRole: string;
}

export function DownloadCenter({ userRole }: DownloadCenterProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const isAdmin = ["ADMIN", "IT"].includes(userRole);
  const { mutate: deleteAll, isPending: isDeletingAll } = useDeleteAllReportJobs();

  const params = {
    page,
    limit: LIMIT,
    // Admin sees ALL users' reports; TRECHOLDER only sees their own
    ...(isAdmin ? { all: true } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isFetching, error } = useReportJobs(params);

  useJobStatus(undefined, (event) => {
    toast.info(`Report ${event.status}`, {
      description: event.fileName ?? event.jobId,
    });
    queryClient.invalidateQueries({ queryKey: ["report-jobs"] });
  });

  const jobs = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  // Calculate batch metrics for current view
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED");
  const processingJobs = jobs.filter((j) => j.status === "PROCESSING");
  const pendingJobs = jobs.filter((j) => j.status === "PENDING");

  const batchTotal = jobs.length;
  const hasActiveJobs = processingJobs.length > 0 || pendingJobs.length > 0;
  const percentCompleted = batchTotal > 0 ? Math.round((completedJobs.length / batchTotal) * 100) : 0;
  const isAllComplete = !hasActiveJobs && batchTotal > 0 && completedJobs.length === batchTotal;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["report-jobs"] });
  };

  const handleDeleteAll = () => {
    const filterLabel = statusFilter === "ALL" ? "ALL" : statusFilter;
    const confirmMsg = `Are you sure you want to permanently DELETE ALL ${filterLabel} report jobs and their files for all TREC Holders? This action cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    deleteAll(
      { status: statusFilter !== "ALL" ? statusFilter : undefined },
      {
        onSuccess: (res) => {
          toast.success(`Deleted ${res?.count ?? 0} report job(s) and associated file(s).`);
        },
        onError: (err) => {
          toast.error("Failed to delete reports", { description: err.message });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold">Download Center</h2>
            {meta && (
              <p className="text-xs text-muted-foreground">
                {meta.total} job{meta.total !== 1 ? "s" : ""} total
                {isAdmin && (
                  <span className="ml-1 text-primary/70">(all TREC Holders)</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Header action buttons */}
        <div className="flex items-center gap-2">
          {/* Delete All button — ADMIN only */}
          {isAdmin && (
            <button
              onClick={handleDeleteAll}
              disabled={isDeletingAll || (meta?.total ?? 0) === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeletingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete All Reports
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Progress Notification Banner (Batch / Active Job Progress) */}
      {(hasActiveJobs || completedJobs.length > 0) && (
        <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                {hasActiveJobs ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : isAllComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {hasActiveJobs
                    ? "Report Generation in Progress..."
                    : isAllComplete
                    ? "Report Generation Complete"
                    : "Batch Report Status Summary"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {completedJobs.length} of {batchTotal} reports completed ({percentCompleted}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium">
              {processingJobs.length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {processingJobs.length} Processing
                </span>
              )}
              {pendingJobs.length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                  <Clock className="w-3 h-3" />
                  {pendingJobs.length} Queued
                </span>
              )}
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                {completedJobs.length} Done
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary via-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>

          {/* Live List of Completed Member Reports */}
          {completedJobs.length > 0 && (
            <div className="pt-3 border-t border-border/50 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Completed Member Reports ({completedJobs.length}):
              </p>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                {completedJobs.map((j) => {
                  const filtersObj = j.filters ? JSON.parse(j.filters) : {};
                  const memberId = filtersObj.trecHolderId || filtersObj.memberCode || j.id.slice(0, 8);
                  return (
                    <span
                      key={j.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Member [{memberId}]
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Live indicator */}
      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Live updates enabled
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{(error as Error).message}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border bg-card animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && jobs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            {statusFilter === "ALL"
              ? "No report jobs yet"
              : `No ${statusFilter.toLowerCase()} jobs`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Generate a report from the &ldquo;New Report&rdquo; page to get started.
          </p>
        </div>
      )}

      {/* Jobs list */}
      {!isLoading && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobProgressCard key={job.id} job={job} userRole={userRole} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {meta?.page} of {totalPages}
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
