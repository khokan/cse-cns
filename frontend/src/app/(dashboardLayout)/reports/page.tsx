import { FileBarChart } from "lucide-react";
import Link from "next/link";
import { ReportRequestForm } from "@/components/modules/reports/ReportRequestForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate Report | CSE-CNS",
  description: "Select a report type, apply filters, and generate PDF, XLSX, or CSV reports.",
};

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileBarChart className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">New Report</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose a report type, apply optional filters, and generate your file.
          </p>
        </div>

        <Link
          href="/reports/download-center"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          View Download Center →
        </Link>
      </div>

      {/* Form */}
      <ReportRequestForm />
    </div>
  );
}
