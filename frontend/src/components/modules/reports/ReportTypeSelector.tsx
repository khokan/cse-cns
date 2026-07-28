"use client";

import { cn } from "@/utils/utils";
import { REPORT_TYPE_CONFIGS, FORMAT_COLORS } from "@/constants/reportConstants";
import type { ReportFormat, ReportType } from "@/types/report.types";
import {
  Users,
  ClipboardList,
  Activity,
  BarChart2,
  Award,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  ClipboardList,
  Activity,
  BarChart2,
  Award,
};

interface ReportTypeSelectorProps {
  selected: ReportType;
  onSelect: (type: ReportType) => void;
  selectedFormat: ReportFormat;
  onFormatSelect: (format: ReportFormat) => void;
}

export function ReportTypeSelector({
  selected,
  onSelect,
  selectedFormat,
  onFormatSelect,
}: ReportTypeSelectorProps) {
  const selectedConfig = REPORT_TYPE_CONFIGS.find((c) => c.id === selected);

  return (
    <div className="space-y-4">
      {/* Report type grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REPORT_TYPE_CONFIGS.map((config) => {
          const Icon = ICON_MAP[config.icon] ?? Users;
          const isSelected = selected === config.id;

          return (
            <button
              key={config.id}
              type="button"
              onClick={() => {
                onSelect(config.id);
                // Auto-select first valid format if current format is not supported
                if (!config.formats.includes(selectedFormat)) {
                  onFormatSelect(config.formats[0]);
                }
              }}
              className={cn(
                "group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30 hover:bg-accent/40"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {config.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-2">
                  {config.description}
                </p>
                {/* Available formats */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {config.formats.map((f) => (
                    <span
                      key={f}
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                        FORMAT_COLORS[f].bg,
                        FORMAT_COLORS[f].text
                      )}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Format selector for selected report type */}
      {selectedConfig && (
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Output Format
          </p>
          <div className="flex gap-2">
            {selectedConfig.formats.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => onFormatSelect(fmt)}
                className={cn(
                  "flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all duration-200",
                  selectedFormat === fmt
                    ? cn(
                        "border-transparent shadow-sm",
                        FORMAT_COLORS[fmt].bg,
                        FORMAT_COLORS[fmt].text
                      )
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent/40"
                )}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
