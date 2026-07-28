import type { ReportTypeConfig } from "@/types/report.types";

// ---------------------------------------------------------------------------
// Report type UI configuration
// ---------------------------------------------------------------------------
export const REPORT_TYPE_CONFIGS: ReportTypeConfig[] = [
  {
    id: "member_list",
    label: "Member Listing",
    description: "Full list of all registered members with bank and contact information.",
    icon: "Users",
    formats: ["PDF", "XLSX", "CSV"],
    hasDateFilter: false,
    hasMemberCodeFilter: true,
    hasRegionFilter: true,
    hasSearchFilter: false,
  },
  {
    id: "trec_holder_summary",
    label: "TrecHolder Summary",
    description: "Summary of all TrecHolder accounts with status and registration dates.",
    icon: "ClipboardList",
    formats: ["PDF", "XLSX"],
    hasDateFilter: false,
    hasMemberCodeFilter: false,
    hasRegionFilter: false,
    hasSearchFilter: true,
  },
  {
    id: "user_activity",
    label: "User Activity Log",
    description: "Session and login activity log for users within a date range.",
    icon: "Activity",
    formats: ["CSV", "XLSX"],
    hasDateFilter: true,
    hasMemberCodeFilter: false,
    hasRegionFilter: false,
    hasSearchFilter: false,
  },
  {
    id: "financial_summary",
    label: "Financial Summary",
    description: "Member account codes, bank routing numbers, EFT and TIN details.",
    icon: "BarChart2",
    formats: ["PDF", "XLSX"],
    hasDateFilter: false,
    hasMemberCodeFilter: false,
    hasRegionFilter: true,
    hasSearchFilter: false,
  },
];

// ---------------------------------------------------------------------------
// Format badge colours
// ---------------------------------------------------------------------------
export const FORMAT_COLORS: Record<string, { bg: string; text: string }> = {
  PDF: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  XLSX: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  CSV: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400" },
};

// ---------------------------------------------------------------------------
// Status badge styles
// ---------------------------------------------------------------------------
export const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  PENDING: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-400",
    label: "Pending",
  },
  PROCESSING: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    label: "Processing",
  },
  COMPLETED: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Completed",
  },
  FAILED: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    label: "Failed",
  },
  CANCELLED: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-400",
    label: "Cancelled",
  },
};

// ---------------------------------------------------------------------------
// Polling interval for active jobs (ms)
// ---------------------------------------------------------------------------
export const REPORT_POLL_INTERVAL_MS = 3000;
