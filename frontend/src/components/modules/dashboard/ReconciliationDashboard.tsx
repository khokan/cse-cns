"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Coins,
  Landmark,
  Layers,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TanstackDataTable } from "@/components/modules/common/tanstack-data-table";
import { useReconciliationSummary } from "@/hooks/useReconciliation";
import { cn } from "@/utils/utils";
import type {
  CashFlowSummaryRow,
  TransactionSummaryRow,
} from "@/types/reconciliation.types";

// Default settlement date — mirrors backend default (sample dataset date)
const DEFAULT_RECONCILIATION_DATE = "2024-06-02";


// ---------------------------------------------------------------------------
// Currency formatting — clean BDT (Taka) formatting
// ---------------------------------------------------------------------------
const formatBDT = (value: number): string =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "symbol",
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace("BDT", "৳");

const formatCompactBDT = (value: number): string =>
  "৳" +
  new Intl.NumberFormat("en-BD", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

// ---------------------------------------------------------------------------
// KPI Card — glassmorphic style with trend indicator
// ---------------------------------------------------------------------------
function KpiCard({
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

// ---------------------------------------------------------------------------
// Group Distribution — interactive donut chart (recharts)
// ---------------------------------------------------------------------------
const GROUP_COLORS: Record<string, string> = {
  "A B G N": "#6366f1",
  Z: "#f59e0b",
  Spot: "#10b981",
};

function GroupDistributionChart({
  spot,
  abgn,
  z,
}: {
  spot: number;
  abgn: number;
  z: number;
}) {
  const chartData = [
    { name: "A B G N", value: abgn },
    { name: "Z", value: z },
    { name: "Spot", value: spot },
  ];
  const total = spot + abgn + z || 1;

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={GROUP_COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              formatBDT(Number(value)),
              String(name),
            ]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-4 text-xs mt-2">
        {chartData.map((seg) => (
          <div key={seg.name} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: GROUP_COLORS[seg.name] }}
            />
            <span className="text-muted-foreground">{seg.name}</span>
            <span className="font-semibold">
              {((seg.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cash Flow Waterfall — recharts composed bar chart of cumulative movement
// ---------------------------------------------------------------------------
function CashFlowChart({ rows }: { rows: CashFlowSummaryRow[] }) {
  const chartRows = rows.filter((r) => !r.isTotalRow);

  const chartData = chartRows.map((r) => ({
    activity: (r.activity ?? "")
      .replace(" Collection", "\nCollection")
      .replace(" Settlement", "\nSettlement"),
    cashIn: r.cashIn || 0,
    cashOut: r.cashOut ? -r.cashOut : 0,
    movement: r.cashMovement,
  }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No settlement activity found.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
        <XAxis
          dataKey="activity"
          tick={{ fontSize: 10 }}
          interval={0}
          height={50}
        />
        <YAxis
          tickFormatter={(v: number) => formatCompactBDT(v)}
          tick={{ fontSize: 10 }}
          width={60}
        />
        <Tooltip
          formatter={(value, name) => [
            formatBDT(Math.abs(Number(value))),
            name === "cashIn" ? "Cash In" : name === "cashOut" ? "Cash Out" : "Movement",
          ]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--card)",
            fontSize: 12,
          }}
        />
        <Legend
          formatter={(v: string) =>
            v === "cashIn" ? "Cash In" : v === "cashOut" ? "Cash Out" : "Cumulative Movement"
          }
          wrapperStyle={{ fontSize: 11 }}
        />
        <Bar dataKey="cashIn" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cashOut" fill="#f43f5e" radius={[0, 0, 4, 4]} />
        <Line
          type="monotone"
          dataKey="movement"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Cash Movement Area Trend — cumulative balance over settlement dates
// ---------------------------------------------------------------------------
function CashMovementTrend({ rows }: { rows: CashFlowSummaryRow[] }) {
  const chartData = rows
    .filter((r) => !r.isTotalRow)
    .map((r, idx) => ({
      idx: idx + 1,
      label: formatDate(r.settlementDate),
      movement: r.cashMovement,
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="movementFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
        <YAxis tickFormatter={(v: number) => formatCompactBDT(v)} tick={{ fontSize: 10 }} width={60} />
        <Tooltip
          formatter={(value) => [formatBDT(Number(value)), "Net Balance"]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--card)",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="movement"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#movementFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

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
        title={`Settlement date: ${formatDate(value)}`}
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
// Table row remark helper — derives a human remark similar to the source
// image's "Remarks" column (only meaningful on the totals row).
// ---------------------------------------------------------------------------
const buildCashFlowRemark = (row: CashFlowSummaryRow): string => {
  if (!row.isTotalRow) return "";
  const diff = row.cashMovement;
  if (Math.abs(diff) < 0.01) return "Fully reconciled (0.00)";
  return diff > 0
    ? `Outstanding balance ${formatBDT(diff)}`
    : `Shortfall ${formatBDT(Math.abs(diff))}`;
};

// ---------------------------------------------------------------------------
// Main dashboard component
// ---------------------------------------------------------------------------
export function ReconciliationDashboard() {
  const [selectedDate, setSelectedDate] = useState(DEFAULT_RECONCILIATION_DATE);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useReconciliationSummary(selectedDate);

  const transactionColumns = useMemo<ColumnDef<TransactionSummaryRow, unknown>[]>(
    () => [
      {
        accessorKey: "tradeDate",
        header: "Trade Date",
        cell: ({ row }) => formatDate(row.original.tradeDate),
      },
      {
        accessorKey: "shareGroup",
        header: "Share Group",
        cell: ({ row }) =>
          row.original.isTotalRow ? (
            <Badge variant="secondary">{row.original.shareGroup}</Badge>
          ) : (
            row.original.shareGroup
          ),
      },
      {
        accessorKey: "collection",
        header: () => <div className="text-right w-full">Collection</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatBDT(row.original.collection)}
          </div>
        ),
      },
      {
        accessorKey: "cseCommission",
        header: () => <div className="text-right w-full">CSE Commission</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatBDT(row.original.cseCommission)}</div>
        ),
      },
      {
        accessorKey: "ait",
        header: () => <div className="text-right w-full">AIT</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatBDT(row.original.ait)}</div>
        ),
      },
      {
        accessorKey: "ipf",
        header: () => <div className="text-right w-full">IPF</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.ipf ? formatBDT(row.original.ipf) : "-"}
          </div>
        ),
      },
      {
        accessorKey: "paymentAfterDeductions",
        header: () => (
          <div className="text-right w-full">Payment after AIT, Com. &amp; IPF</div>
        ),
        cell: ({ row }) => (
          <div
            className={cn(
              "text-right font-semibold",
              row.original.isTotalRow && "text-primary"
            )}
          >
            {formatBDT(row.original.paymentAfterDeductions)}
          </div>
        ),
      },
    ],
    []
  );

  const cashFlowColumns = useMemo<ColumnDef<CashFlowSummaryRow, unknown>[]>(
    () => [
      {
        accessorKey: "sn",
        header: "SN",
        cell: ({ row }) => row.original.sn ?? "—",
      },
      {
        accessorKey: "settlementDate",
        header: "Settlement Date",
        cell: ({ row }) => formatDate(row.original.settlementDate),
      },
      {
        accessorKey: "activity",
        header: "Activity",
        cell: ({ row }) =>
          row.original.isTotalRow ? (
            <Badge variant="secondary">Total</Badge>
          ) : (
            row.original.activity
          ),
      },
      {
        accessorKey: "cashIn",
        header: () => <div className="text-right w-full">Cash In</div>,
        cell: ({ row }) => (
          <div className="text-right text-emerald-600 dark:text-emerald-400">
            {row.original.cashIn ? formatBDT(row.original.cashIn) : "-"}
          </div>
        ),
      },
      {
        accessorKey: "cashOut",
        header: () => <div className="text-right w-full">Cash Out</div>,
        cell: ({ row }) => (
          <div className="text-right text-rose-600 dark:text-rose-400">
            {row.original.cashOut ? formatBDT(row.original.cashOut) : "-"}
          </div>
        ),
      },
      {
        accessorKey: "cashMovement",
        header: () => <div className="text-right w-full">Cash Movement</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold">
            {formatBDT(row.original.cashMovement)}
          </div>
        ),
      },
      {
        id: "remarks",
        header: "Remarks",
        cell: ({ row }) => {
          const remark = buildCashFlowRemark(row.original);
          return remark ? (
            <span className="text-xs font-medium text-muted-foreground">
              {remark}
            </span>
          ) : (
            ""
          );
        },
      },
    ],
    []
  );

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
            Trade Date {formatDate(date)} · Last updated{" "}
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

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Spot" value={receivable.spot} icon={Wallet} accent="text-emerald-500 bg-emerald-500" />
        <KpiCard label="A B G N" value={receivable.abgn} icon={Layers} accent="text-primary bg-primary" />
        <KpiCard label="Z" value={receivable.z} icon={Coins} accent="text-amber-500 bg-amber-500" />
        <KpiCard label="Total Value" value={receivable.totalValue} icon={Landmark} accent="text-indigo-500 bg-indigo-500" sublabel="Receivable against trade date" />
        <KpiCard label="CSE Commission" value={cseCommissionTotal} icon={Banknote} accent="text-cyan-500 bg-cyan-500" />
        <KpiCard label="AIT" value={aitTotal} icon={Coins} accent="text-rose-500 bg-rose-500" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/60 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Group Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GroupDistributionChart
              spot={receivable.spot}
              abgn={receivable.abgn}
              z={receivable.z}
            />
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Net Cash Movement Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CashMovementTrend rows={cashFlow} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/60 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Cash Flow Settlement Timeline (T0 → T3)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-2 text-xs">
            <span className="flex items-center gap-1.5">
              <ArrowDownRight className="h-3 w-3 text-emerald-500" /> Cash In
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3 w-3 text-rose-500" /> Cash Out
            </span>
          </div>
          <CashFlowChart rows={cashFlow} />
        </CardContent>
      </Card>

      {/* Transaction Breakdown Table */}
      <TanstackDataTable
        title="Transaction Summary"
        description="Collection, CSE commission, AIT & IPF breakdown by share group"
        columns={transactionColumns}
        data={transactions}
        searchKeys={["shareGroup"]}
        initialPageSize={10}
        noDataText="No transaction records found for the selected date."
      />

      {/* Cash Flow Detail Table */}
      <TanstackDataTable
        title="Settlement Flow Chart"
        description={`Activity waterfall against Trade Date: ${formatDate(date)}`}
        columns={cashFlowColumns}
        data={cashFlow}
        searchKeys={["activity"]}
        initialPageSize={10}
        noDataText="No settlement activity found for the selected date."
      />
    </div>
  );
}
