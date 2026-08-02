"use client";

import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TanstackDataTable } from "@/components/modules/dataTable/tanstack-data-table";
import { DateFormatter } from "@/utils/tanstack-table-helpers";
import type { CashFlowSummaryRow } from "@/types/reconciliation.types";
import { formatBDT, formatCompactBDT } from "./format";

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
      label: DateFormatter.dateLabel(r.settlementDate),
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
// Cash Flow Section — waterfall chart, trend chart & settlement detail table
// ---------------------------------------------------------------------------
export function CashFlowSection({
  cashFlow,
  tradeDate,
}: {
  cashFlow: CashFlowSummaryRow[];
  tradeDate: string;
}) {
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
        cell: ({ row }) => DateFormatter.dateLabel(row.original.settlementDate),
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
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
      </div>

      <TanstackDataTable
        title="Settlement Flow Chart"
        description={`Activity waterfall against Trade Date: ${DateFormatter.dateLabel(tradeDate)}`}
        columns={cashFlowColumns}
        data={cashFlow}
        searchKeys={["activity"]}
        initialPageSize={10}
        noDataText="No settlement activity found for the selected date."
      />
    </div>
  );
}
