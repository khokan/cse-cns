"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useReconciliationSummary } from "@/hooks/useReconciliation";
import { cn } from "@/utils/utils";
import { ReceivableSection } from "./reconciliation/ReceivableSection";
import { TransactionsSection } from "./reconciliation/TransactionsSection";
import { CashFlowSection } from "./reconciliation/CashFlowSection";
import { DateFormatter } from "../datatable/tanstack-table-helpers";

// Default settlement date — mirrors backend default (sample dataset date)
const DEFAULT_RECONCILIATION_DATE = "2024-06-02";

// ---------------------------------------------------------------------------
// Icon-based date control — a calendar icon button that opens the native
// date picker; the dashboard is re-fetched for the selected settlement date.
// ---------------------------------------------------------------------------
function DateControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    // showPicker() is supported in modern Chromium/Edge/Firefox; fall back to focus+click.
    if (typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el.focus();
      el.click();
    }
  };

  return (
    <div className="relative flex items-center">
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={openPicker}
        title={`Settlement date: ${DateFormatter.dateLabel(value)}`}
        className="relative"
      >
        <CalendarDays className="h-4 w-4" />
      </Button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label="Select settlement date"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function ReconciliationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard component
// ---------------------------------------------------------------------------
export function ReconciliationDashboard() {
  const [selectedDate, setSelectedDate] = useState(DEFAULT_RECONCILIATION_DATE);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useReconciliationSummary(selectedDate);

  if (isLoading) return <ReconciliationSkeleton />;

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Failed to load reconciliation dashboard</AlertTitle>
        <AlertDescription className="flex items-center justify-between w-full gap-4">
          <span>
            {error instanceof Error
              ? error.message
              : "Something went wrong while fetching reconciliation data."}
          </span>
          <div className="flex items-center gap-2">
            <DateControl value={selectedDate} onChange={setSelectedDate} />
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const { date, receivable, transactions, cashFlow, generatedAt } = data;

  const cseCommissionTotal = transactions
    .filter((t) => !t.isTotalRow)
    .reduce((sum, t) => sum + t.cseCommission, 0);
  const aitTotal = transactions
    .filter((t) => !t.isTotalRow)
    .reduce((sum, t) => sum + t.ait, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-linear-to-r from-primary/10 via-transparent to-transparent p-5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Trade Day Wise Reconciliation
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Trade Date {DateFormatter.dateLabel(date)} · Last updated{" "}
            {new Date(generatedAt).toLocaleString("en-GB")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateControl value={selectedDate} onChange={setSelectedDate} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Receivable — KPI cards + group distribution donut */}
      <ReceivableSection
        receivable={receivable}
        cseCommissionTotal={cseCommissionTotal}
        aitTotal={aitTotal}
      />

      {/* Cash Flow — trend chart, waterfall chart & settlement detail table */}
      <CashFlowSection cashFlow={cashFlow} tradeDate={date} />

      {/* Transactions — breakdown table */}
      <TransactionsSection transactions={transactions} />
    </div>
  );
}
