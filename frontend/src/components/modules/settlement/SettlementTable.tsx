"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TanstackDataTable } from "@/components/modules/common/tanstack-data-table";
import type { SettlementRecord } from "@/types/settlement.types";

export type SettlementTableProps = {
  settlements: SettlementRecord[];
  loading?: boolean;
  onRefresh?: () => void;
  onRetry?: (contractNumber: string) => void;
  onBulkDelete?: (contractNumbers: string[]) => Promise<void>;
  onExport?: (contractNumbers?: string[]) => Promise<Blob>;
};

export function SettlementTable({
  settlements,
  loading,
  onRefresh,
  onRetry,
  onBulkDelete,
  onExport,
}: SettlementTableProps) {
  // Define table columns
  const columns: ColumnDef<SettlementRecord>[] = useMemo(
    () => [
      {
        accessorKey: "ContractNumber",
        header: "Contract #",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "ScripID",
        header: "Scrip ID",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "Quantity",
        header: "Quantity",
        cell: ({ getValue }) => getValue() ?? "-",
      },
      {
        accessorKey: "Price",
        header: "Price",
        cell: ({ getValue }) => getValue() ?? "-",
      },
      {
        accessorKey: "ProcessType",
        header: "Status",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const isSettled = value === "Y";
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isSettled
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {isSettled ? "SETTLED" : "PENDING"}
            </span>
          );
        },
      },
      {
        accessorKey: "TradeDate",
        header: "Trade Date",
        cell: ({ getValue }) => {
          const date = getValue() as string | undefined;
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
    ],
    []
  );

  return (
    <TanstackDataTable
      columns={columns}
      data={settlements}
      title="Settlement Records"
      searchKeys={["ContractNumber", "ScripID"]}
      initialPageSize={10}
      pageSizeOptions={[5, 10, 20, 50]}
      noDataText={loading ? "Loading settlements..." : "No settlement records found."}
      topRightActions={
        onRefresh ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8 gap-1.5 text-xs font-medium border-border/80 shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            Refresh
          </Button>
        ) : undefined
      }
      renderRowActions={
        onRetry
          ? (row) => (
              <button
                onClick={() => onRetry((row as SettlementRecord).ContractNumber)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Retry Job
              </button>
            )
          : undefined
      }
      bulkActions={{
        onDelete: onBulkDelete,
        onExport: onExport,
        getRowId: (row) => (row as SettlementRecord).ContractNumber,
      }}
    />
  );
}
