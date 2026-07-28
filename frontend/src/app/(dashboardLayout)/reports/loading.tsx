import { Loader2 } from "lucide-react";

export default function ReportsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-36 rounded-xl bg-muted animate-pulse" />
      </div>

      {/* Report type skeleton */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <div className="h-5 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
