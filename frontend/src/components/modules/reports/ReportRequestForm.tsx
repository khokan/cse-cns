"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileBarChart, Loader2, Filter } from "lucide-react";
import { ReportTypeSelector } from "./ReportTypeSelector";
import { useRequestReport } from "@/lib/hooks/useReportJobs";
import { REPORT_TYPE_CONFIGS } from "@/constants/reportConstants";
import type { ReportFormat, ReportType } from "@/types/report.types";
import { cn } from "@/utils/utils";

export function ReportRequestForm() {
  const router = useRouter();
  const { mutate: request, isPending } = useRequestReport();

  // Form state
  const [reportType, setReportType] = useState<ReportType>("member_list");
  const [format, setFormat] = useState<ReportFormat>("XLSX");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");

  const config = REPORT_TYPE_CONFIGS.find((c) => c.id === reportType)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filters = {
      ...(config.hasDateFilter && dateFrom ? { dateFrom } : {}),
      ...(config.hasDateFilter && dateTo ? { dateTo } : {}),
      ...(config.hasMemberCodeFilter && memberCode ? { memberCode } : {}),
      ...(config.hasRegionFilter && region ? { region } : {}),
      ...(config.hasSearchFilter && search ? { search } : {}),
    };

    request(
      { reportType, format, filters },
      {
        onSuccess: (data) => {
          toast.success("Report queued!", {
            description: `Your ${config.label} (${format}) is being generated.`,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
      {(config.hasDateFilter ||
        config.hasMemberCodeFilter ||
        config.hasRegionFilter ||
        config.hasSearchFilter) && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold">Filters</h2>
            <span className="text-xs text-muted-foreground">(optional)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.hasDateFilter && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={dateTo || undefined}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    To Date
                  </label>
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
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Member Code
                </label>
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
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Region
                </label>
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
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all duration-200",
            "bg-primary text-primary-foreground shadow-sm",
            "hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-sm"
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
              Generate {format} Report
            </>
          )}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";
