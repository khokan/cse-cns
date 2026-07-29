"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileBarChart, Loader2, Filter, Users } from "lucide-react";
import { ReportTypeSelector } from "./ReportTypeSelector";
import { MemberSelectBox } from "./MemberSelectBox";
import { useRequestReport, useMembersList } from "@/hooks/useReportJobs";
import { REPORT_TYPE_CONFIGS } from "@/constants/reportConstants";
import type { ReportFormat, ReportType } from "@/types/report.types";
import { cn } from "@/utils/utils";

// Generate fiscal year options: e.g. "2024-2025", "2025-2026"
function getFiscalYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const options: string[] = [];
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    options.push(`${y}-${y + 1}`);
  }
  return options.reverse();
}

interface ReportRequestFormProps {
  userRole?: string;
}

export function ReportRequestForm({ userRole }: ReportRequestFormProps) {
  const router = useRouter();
  const { mutate: request, isPending } = useRequestReport();

  const isAdmin = ["ADMIN", "IT"].includes(userRole ?? "");
  const isTrecHolder = userRole === "TRECHOLDER";

  // Fetch members list count for button labels
  const { data: membersList = [] } = useMembersList(isAdmin);

  // Form state
  const [reportType, setReportType] = useState<ReportType>("trec_holder_tax_certificate");
  const [format, setFormat] = useState<ReportFormat>("PDF");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");
  const [trecHolderId, setTrecHolderId] = useState("");
  const [fiscalYear, setFiscalYear] = useState("2024-2025");

  // Selection box state for ADMIN
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const config = REPORT_TYPE_CONFIGS.find((c) => c.id === reportType)!;

  const handleGenerate = (isBulk: boolean = false) => {
    if (config.hasFiscalYearFilter && !fiscalYear.trim()) {
      toast.error("Please select a Fiscal Year.");
      return;
    }

    if (
      !isBulk &&
      selectedMemberIds.length === 0 &&
      isAdmin &&
      config.hasTrecHolderFilter &&
      !trecHolderId.trim() &&
      !memberCode.trim()
    ) {
      toast.error("Please select members, enter a TREC Holder ID, or click 'Generate for All Members'.");
      return;
    }

    const filters = {
      ...(config.hasDateFilter && dateFrom ? { dateFrom } : {}),
      ...(config.hasDateFilter && dateTo ? { dateTo } : {}),
      ...(config.hasMemberCodeFilter && memberCode ? { memberCode } : {}),
      ...(config.hasRegionFilter && region ? { region } : {}),
      ...(config.hasSearchFilter && search ? { search } : {}),
      ...(config.hasTrecHolderFilter && trecHolderId ? { trecHolderId: trecHolderId.trim() } : {}),
      ...(config.hasFiscalYearFilter && fiscalYear ? { fiscalYear } : {}),
      ...(isBulk ? { isBulk: true } : {}),
      ...(selectedMemberIds.length > 0 && !isBulk ? { selectedMemberIds } : {}),
    };

    const isMultiBatch = isBulk || selectedMemberIds.length > 1;

    request(
      { reportType, format, filters },
      {
        onSuccess: () => {
          const countLabel = isBulk
            ? `all ${membersList.length} members`
            : `${selectedMemberIds.length} selected member(s)`;

          toast.success(isMultiBatch ? "Batch Reports Queued!" : "Report Queued!", {
            description: isMultiBatch
              ? `Report generation initiated for ${countLabel}. Track progress in Download Center.`
              : `Your ${config.label} (${format}) is being generated.`,
            action: {
              label: "View Progress",
              onClick: () => router.push("/reports/download-center"),
            },
          });
          router.push("/reports/download-center");
        },
        onError: (err) => {
          toast.error("Failed to queue report", { description: err.message });
        },
      }
    );
  };

  const hasFilters =
    config.hasDateFilter ||
    config.hasMemberCodeFilter ||
    config.hasRegionFilter ||
    config.hasSearchFilter ||
    config.hasTrecHolderFilter ||
    config.hasFiscalYearFilter ||
    isAdmin;

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
      {/* Section: Report type + format */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">Select Report Type</h2>
        </div>
        <ReportTypeSelector
          selected={reportType}
          onSelect={setReportType}
          selectedFormat={format}
          onFormatSelect={setFormat}
        />
      </div>

      {/* Section: Filters (contextual) */}
      {hasFilters && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.hasDateFilter && (
              <>
                <div className="space-y-1.5">
                  <label className={labelClass}>From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={dateTo || undefined}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom || undefined}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {config.hasMemberCodeFilter && (
              <div className="space-y-1.5">
                <label className={labelClass}>Member Code</label>
                <input
                  type="text"
                  placeholder="e.g. MEM001"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {config.hasRegionFilter && (
              <div className="space-y-1.5">
                <label className={labelClass}>Region</label>
                <input
                  type="text"
                  placeholder="Clearing region ID"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {config.hasSearchFilter && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className={labelClass}>Search</label>
                <input
                  type="text"
                  placeholder="Name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {/* Fiscal Year dropdown — shown for both roles */}
            {config.hasFiscalYearFilter && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className={labelClass}>
                  Fiscal Year
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  id="fiscalYear"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  required
                  className={inputClass}
                >
                  {getFiscalYearOptions().map((fy) => (
                    <option key={fy} value={fy}>
                      {fy}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ---- Reusable Member Selection Box for ADMIN ---- */}
            {isAdmin && (
              <div className="sm:col-span-2">
                <MemberSelectBox
                  selectedMemberIds={selectedMemberIds}
                  onChange={setSelectedMemberIds}
                />
              </div>
            )}

            {/* Optional single member fallback input for ADMIN */}
            {config.hasTrecHolderFilter && isAdmin && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className={labelClass}>
                  Or Specify Single TREC Holder ID
                  <span className="ml-1 text-xs text-muted-foreground font-normal">(optional fallback)</span>
                </label>
                <input
                  id="trecHolderId"
                  type="text"
                  placeholder="e.g. 121001"
                  value={trecHolderId}
                  onChange={(e) => setTrecHolderId(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {isAdmin && (
          <>
            {/* Generate for Selected Members */}
            {selectedMemberIds.length > 0 && (
              <button
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200",
                  "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Generate for Selected ({selectedMemberIds.length})
                  </>
                )}
              </button>
            )}

            {/* Generate for All Members */}
            <button
              type="button"
              onClick={() => handleGenerate(true)}
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200",
                "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating for All...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Generate for All ({membersList.length})
                </>
              )}
            </button>
          </>
        )}

        {/* Standard / TRECHOLDER generate button */}
        {(!isAdmin || selectedMemberIds.length === 0) && (
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all duration-200",
              "bg-primary text-primary-foreground shadow-sm",
              "hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Queuing Report...
              </>
            ) : (
              <>
                <FileBarChart className="w-4 h-4" />
                {isTrecHolder ? `Generate ${format} Report` : `Generate Individual Report (${format})`}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}

const labelClass =
  "text-xs font-medium text-muted-foreground uppercase tracking-wide";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";
