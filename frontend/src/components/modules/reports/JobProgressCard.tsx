"use client";

import { FileText, Download, X, RefreshCw, AlertCircle, Clock, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { JobStatusBadge } from "./JobStatusBadge";
import { FORMAT_COLORS, REPORT_TYPE_CONFIGS } from "@/constants/reportConstants";
import { downloadReport } from "@/services/report.service";
import { useCancelReportJob, useRequestReport } from "@/hooks/useReportJobs";
import type { ReportJob } from "@/types/report.types";
import { cn } from "@/utils/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface JobProgressCardProps {
  job: ReportJob;
  userRole?: string;
}

const STATUS_ICONS = {
  PENDING: Clock,
  PROCESSING: Loader2,
  COMPLETED: CheckCircle2,
  FAILED: AlertCircle,
  CANCELLED: X,
};

export function JobProgressCard({ job, userRole }: JobProgressCardProps) {
  const { mutate: cancelJob, isPending: isCancelling } = useCancelReportJob();
  const { mutate: retryJob, isPending: isRetrying } = useRequestReport();

  const isAdmin = ["ADMIN", "IT"].includes(userRole ?? "");
  const typeConfig = REPORT_TYPE_CONFIGS.find((c) => c.id === job.reportType);
  const formatStyle = FORMAT_COLORS[job.format];
  const StatusIcon = STATUS_ICONS[job.status] ?? Clock;
  const filters = job.filters ? JSON.parse(job.filters) : {};
  const hasFilters = Object.values(filters).some((v) => v != null && v !== "");

  const handleDownload = () => {
    downloadReport(job.id);
    toast.success("Download started!");
  };

  const handleCancelOrDelete = () => {
    cancelJob(job.id, {
      onSuccess: () => {
        if (isAdmin) {
          toast.success("Report job deleted permanently.");
        } else {
          toast.success("Report job cancelled.");
        }
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleRetry = () => {
    retryJob(
      {
        reportType: job.reportType,
        format: job.format,
        filters: filters,
      },
      {
        onSuccess: () => toast.success("Report re-queued successfully!"),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card p-5 transition-all duration-300",
        "hover:shadow-md hover:-translate-y-0.5",
        job.status === "PROCESSING" && "border-blue-200 dark:border-blue-800 shadow-blue-50 dark:shadow-blue-950",
        job.status === "COMPLETED" && "border-emerald-200 dark:border-emerald-800",
        job.status === "FAILED" && "border-red-200 dark:border-red-800"
      )}
    >
      {/* Processing animated top bar */}
      {job.status === "PROCESSING" && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl overflow-hidden">
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 bg-[length:200%_100%]" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Left: icon + info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              job.status === "COMPLETED" && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
              job.status === "PROCESSING" && "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
              job.status === "PENDING" && "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
              job.status === "FAILED" && "bg-red-100 dark:bg-red-900/30 text-red-600",
              job.status === "CANCELLED" && "bg-slate-100 dark:bg-slate-800 text-slate-500"
            )}
          >
            <StatusIcon
              className={cn(
                "w-5 h-5",
                job.status === "PROCESSING" && "animate-spin"
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {typeConfig?.label ?? job.reportType}
              </h3>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", formatStyle.bg, formatStyle.text)}>
                {job.format}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Requested{" "}
              {formatDistanceToNow(new Date(job.requestedAt), { addSuffix: true })}
            </p>

            {/* Filters row */}
            {hasFilters && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(filters)
                  .filter(([, v]) => v != null && v !== "")
                  .map(([k, v]) => (
                    <span
                      key={k}
                      className="text-xs bg-muted/70 text-muted-foreground rounded px-1.5 py-0.5"
                    >
                      {k}: <span className="font-medium text-foreground">{String(v)}</span>
                    </span>
                  ))}
              </div>
            )}

            {/* Error message */}
            {job.status === "FAILED" && job.errorMessage && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-1.5 flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                {job.errorMessage}
              </p>
            )}

            {/* File size on completion */}
            {job.status === "COMPLETED" && job.fileSize && (
              <p className="mt-1 text-xs text-muted-foreground">
                <FileText className="inline w-3 h-3 mr-1" />
                {(job.fileSize / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        </div>

        {/* Right: status badge + actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <JobStatusBadge status={job.status} />

          <div className="flex items-center gap-1.5">
            {/* Download — COMPLETED only */}
            {job.status === "COMPLETED" && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            )}

            {/* Retry — FAILED only */}
            {job.status === "FAILED" && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRetrying && "animate-spin")} />
                Retry
              </button>
            )}

            {/* Cancel — available for TRECHOLDER when PENDING or PROCESSING, or for ADMIN always */}
            {(job.status === "PENDING" || job.status === "PROCESSING") && !isAdmin && (
              <button
                onClick={handleCancelOrDelete}
                disabled={isCancelling}
                title="Cancel job"
                className="flex items-center gap-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <X className={cn("w-3.5 h-3.5", isCancelling && "animate-spin")} />
                Cancel
              </button>
            )}

            {/* Delete — ADMIN only (can delete any job regardless of status) */}
            {isAdmin && (
              <button
                onClick={handleCancelOrDelete}
                disabled={isCancelling}
                title="Delete report job and file"
                className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 className={cn("w-3.5 h-3.5", isCancelling && "animate-spin")} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
