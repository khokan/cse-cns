"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/utils";
import { formatBDT } from "./format";

// ---------------------------------------------------------------------------
// KPI Card — glassmorphic style with trend indicator
// ---------------------------------------------------------------------------
export function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  sublabel,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  sublabel?: string;
}) {
  return (
    <Card className="group relative overflow-hidden border-white/10 bg-card/60 backdrop-blur-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 supports-backdrop-filter:bg-card/40">
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30",
          accent
        )}
      />
      <CardContent className="p-5 relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              accent,
              "bg-opacity-15"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {formatBDT(value)}
        </p>
        {sublabel ? (
          <p className="text-[11px] text-muted-foreground mt-1">{sublabel}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
