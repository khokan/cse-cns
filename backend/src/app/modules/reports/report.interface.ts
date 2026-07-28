// ---------------------------------------------------------------------------
// Report Engine — TypeScript interfaces & types
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
    | "financial_summary";

// ---------------------------------------------------------------------------
// Filter shapes per report type
// ---------------------------------------------------------------------------
export interface ReportFilters {
    dateFrom?: string;   // ISO date string
    dateTo?: string;     // ISO date string
    memberCode?: string;
    region?: string;
    userId?: string;
    search?: string;
}

// ---------------------------------------------------------------------------
// DTO for POST /api/v1/reports/request
// ---------------------------------------------------------------------------
export interface CreateReportJobDto {
    reportType: ReportType;
    format: ReportFormat;
    filters?: ReportFilters;
}

// ---------------------------------------------------------------------------
// Internal payload queued for the worker
// ---------------------------------------------------------------------------
export interface ReportJobPayload {
    reportJobId: string;
    userId: string;
    reportType: ReportType;
    format: ReportFormat;
    filters: ReportFilters;
}

// ---------------------------------------------------------------------------
// Query params for GET /api/v1/reports/jobs
// ---------------------------------------------------------------------------
export interface ReportJobQuery {
    page?: string;
    limit?: string;
    status?: ReportStatus;
    reportType?: ReportType;
    format?: ReportFormat;
    all?: string; // ADMIN only — show all users' jobs
}
