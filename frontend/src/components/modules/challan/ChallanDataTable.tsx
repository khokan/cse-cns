"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TanstackDataTable } from "@/components/modules/dataTable/tanstack-data-table";
import { Pencil } from "lucide-react";
import type { ChallanItem } from "@/types/challan.types";
import type { UserRole } from "@/utils/authUtils";
import {
  canUpdateChallan,
  canDeleteChallan,
} from "@/utils/rolePermissions";

interface ChallanTableProps {
  data: ChallanItem[];
  isLoading?: boolean;
  userRole?: string;
  onEdit?: (challan: ChallanItem) => void;
  onView?: (challan: ChallanItem) => void;
  onDelete?: (ids: string[]) => Promise<void>;
  onExport?: (ids?: string[]) => Promise<Blob>;
  pageIndex?: number;
  pageSize?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function ChallanDataTable({
  data,
  isLoading = false,
  userRole = "TRECHOLDER",
  onEdit,
  // onView is available for future use with read-only view dialog
  onDelete,
  onExport,
  pageIndex = 0,
  pageSize = 10,
  totalRecords = 0,
  onPageChange,
  onPageSizeChange,
}: ChallanTableProps) {
  // Check user permissions
  const canUpdate = canUpdateChallan(userRole as UserRole);
  const canDelete = canDeleteChallan(userRole as UserRole);
  const columns: ColumnDef<ChallanItem>[] = React.useMemo(
    () => [
      {
        id: "select",
        size: 40,
        enableHiding: false,
      },
      {
        accessorKey: "ChallanNumber",
        header: "Challan Number",
        size: 150,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            {row.original.ChallanNumber || "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "ChallanDate",
        header: "Challan Date",
        size: 120,
        cell: ({ row }) =>
          row.original.ChallanDate
            ? new Date(row.original.ChallanDate).toLocaleDateString()
            : "—",
      },
      {
        accessorKey: "ChallanPeriodStartDate",
        header: "Period Start",
        size: 120,
        cell: ({ row }) =>
          row.original.ChallanPeriodStartDate
            ? new Date(row.original.ChallanPeriodStartDate).toLocaleDateString()
            : "—",
      },
      {
        accessorKey: "ChallanPeriodEndDate",
        header: "Period End",
        size: 120,
        cell: ({ row }) =>
          row.original.ChallanPeriodEndDate
            ? new Date(row.original.ChallanPeriodEndDate).toLocaleDateString()
            : "—",
      },
      {
        accessorKey: "TotalTaxAmount",
        header: "Total Tax Amount",
        size: 130,
        cell: ({ row }) =>
          row.original.TotalTaxAmount
            ? `৳${row.original.TotalTaxAmount.toLocaleString()}`
            : "—",
      },
    ],
    []
  );

  return (
    <TanstackDataTable<ChallanItem>
      columns={columns}
      data={data}
      title="Challans"
      description="Manage and view all challans"
      searchKeys={["ChallanNumber"]}
      filters={[
        {
          field: "ChallanDate",
          label: "Challan Date",
          options: [],
        },
      ]}
      isLoading={isLoading}
      manualPagination={true}
      pageIndex={pageIndex}
      pageSize={pageSize}
      totalRecords={totalRecords}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      bulkActions={
        (onDelete || onExport) && (canDelete || onExport)
          ? {
              onDelete: canDelete ? onDelete : undefined,
              onExport,
              getRowId: (row) => String((row as ChallanItem).ID),
            }
          : undefined
      }
      renderRowActions={(item: ChallanItem) =>
        onEdit && canUpdate ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            title="Edit Challan"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null
      }
    />
  );
}
