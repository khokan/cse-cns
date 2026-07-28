"use client";

import { cn } from "@/utils/utils";
import { STATUS_STYLES } from "@/constants/reportConstants";
import type { ReportStatus } from "@/types/report.types";

interface JobStatusBadgeProps {
  status: ReportStatus;
  showDot?: boolean;
  className?: string;
}

export function JobStatusBadge({
  status,
  showDot = true,
  className,
}: JobStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        style.bg,
        style.text,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {(status === "PENDING" || status === "PROCESSING") && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                style.dot
              )}
            />
          )}
          <span
            className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", style.dot)}
          />
        </span>
      )}
      {style.label}
    </span>
  );
}
