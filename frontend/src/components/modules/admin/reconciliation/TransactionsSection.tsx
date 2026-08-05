"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { TanstackDataTable } from "@/components/modules/datatable/tanstack-data-table";
import { DateFormatter } from "@/components/modules/datatable/tanstack-table-helpers";
import { cn } from "@/utils/utils";
import type { TransactionSummaryRow } from "@/types/reconciliation.types";
import { formatBDT } from "./format";

// ---------------------------------------------------------------------------
// Transactions Section — Collection, CSE commission, AIT & IPF breakdown
// ---------------------------------------------------------------------------
export function TransactionsSection({
  transactions,
}: {
  transactions: TransactionSummaryRow[];
}) {
  const transactionColumns = useMemo<ColumnDef<TransactionSummaryRow, unknown>[]>(
    () => [
      {
        accessorKey: "tradeDate",
        header: "Trade Date",
        cell: ({ row }) => DateFormatter.dateLabel(row.original.tradeDate),
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

  return (
    <TanstackDataTable
      title="Transaction Summary"
      description="Collection, CSE commission, AIT & IPF breakdown by share group"
      columns={transactionColumns}
      data={transactions}
      searchKeys={["shareGroup"]}
      initialPageSize={10}
      noDataText="No transaction records found for the selected date."
    />
  );
}
