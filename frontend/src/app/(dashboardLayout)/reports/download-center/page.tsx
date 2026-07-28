import { Download } from "lucide-react";
import Link from "next/link";
import { DownloadCenter } from "@/components/modules/reports/DownloadCenter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Center | CSE-CNS",
  description: "Track and download your generated reports. Status updates in real-time.",
};

export default function DownloadCenterPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Download className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Download Center</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Track report generation progress and download completed files.
          </p>
        </div>

        <Link
          href="/reports"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          + New Report
        </Link>
      </div>

      {/* Download Center client component with polling */}
      <DownloadCenter />
    </div>
  );
}
