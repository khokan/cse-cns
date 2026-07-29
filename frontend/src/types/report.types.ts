// ---------------------------------------------------------------------------
// Report Engine — shared TypeScript types for the frontend
// ---------------------------------------------------------------------------

export type ReportStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ReportFormat = "PDF" | "XLSX" | "CSV";

export type ReportType =
  | "member_list"
  | "trec_holder_summary"
  | "user_activity"
  | "financial_summary"
  | "trec_holder_tax_certificate";

// ---------------------------------------------------------------------------
// API response shape for a single ReportJob
// ---------------------------------------------------------------------------
export interface ReportJob {
  id: string;
  userId: string;
  user?: { name: string; email: string };
  reportType: ReportType;
  format: ReportFormat;
  filters?: string | null; // JSON string
  status: ReportStatus;
  queueJobId?: string | null;
  filePath?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
  errorMessage?: string | null;
  requestedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

// ---------------------------------------------------------------------------
// POST /api/v1/reports/request body
// ---------------------------------------------------------------------------
export interface CreateReportJobPayload {
  reportType: ReportType;
  format: ReportFormat;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    memberCode?: string;
    region?: string;
    search?: string;
    // Tax certificate specific
    trecHolderId?: string;
    fiscalYear?: string;
    isBulk?: boolean;
    selectedMemberIds?: string[];
  };
}

// ---------------------------------------------------------------------------
// POST /api/v1/reports/request success response data
// ---------------------------------------------------------------------------
export interface RequestReportResponse {
  jobId: string;
  queueJobId: string;
  status: "PENDING";
  reportType: ReportType;
  format: ReportFormat;
  requestedAt: string;
  estimatedWait: number;
}

// ---------------------------------------------------------------------------
// GET /api/v1/reports/jobs query params
// ---------------------------------------------------------------------------
export interface ReportJobQueryParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  reportType?: ReportType;
  format?: ReportFormat;
  all?: boolean;
}

// ---------------------------------------------------------------------------
// Pagination meta
// ---------------------------------------------------------------------------
export interface ReportMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Paginated list response
// ---------------------------------------------------------------------------
export interface PaginatedReportJobs {
  data: ReportJob[];
  meta: ReportMeta;
}

// ---------------------------------------------------------------------------
// Config for each report type shown in the UI
// ---------------------------------------------------------------------------
export interface ReportTypeConfig {
  id: ReportType;
  label: string;
  description: string;
  icon: string;
  formats: ReportFormat[];
  hasDateFilter: boolean;
  hasMemberCodeFilter: boolean;
  hasRegionFilter: boolean;
  hasSearchFilter: boolean;
  hasTrecHolderFilter?: boolean;
  hasFiscalYearFilter?: boolean;
}
