"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TanstackDataTable } from "@/components/modules/datatable/tanstack-data-table";
import { Pencil } from "lucide-react";
import type { TaxToNBRItem } from "@/types/taxToNBR.types";
import type { UserRole } from "@/utils/authUtils";
import {
  canUpdateTaxToNBR,
  canDeleteTaxToNBR,
} from "@/utils/rolePermissions";

/**
 * Safe currency formatter - handles numbers, strings, and Decimal objects
 * Converts any format to standardized Bengali currency display (৳)
 * Fixes: [object Object] display issue from Prisma Decimal serialization
 */
const formatCurrency = (value: unknown): string => {
  if (!value && value !== 0) return "—";

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log("[formatCurrency] Input:", { value, type: typeof value });
  }

  let numValue: number;

  // Handle multiple formats: Decimal object, string, or number
  if (typeof value === "object" && value !== null) {
    const objValue = value as Record<string, unknown>;
    
    // Log object structure for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[formatCurrency] Object value keys:", Object.keys(objValue));
    }
    
    if ("big" in objValue || "small" in objValue) {
      // Prisma Decimal object structure { big, small }
      const bigVal = objValue.big instanceof Object ? (objValue.big as Record<string, unknown>).toString?.() : String(objValue.big);
      const smallVal = objValue.small instanceof Object ? (objValue.small as Record<string, unknown>).toString?.() : String(objValue.small);
      numValue = Number(bigVal ?? smallVal ?? 0);
    } else if ("s" in objValue && "e" in objValue && "d" in objValue) {
      // Prisma Decimal structure { s: sign, e: exponent, d: digits[] }
      const strVal = String(value);
      numValue = parseFloat(strVal);
      if (process.env.NODE_ENV === "development") {
        console.log("[formatCurrency] Detected Decimal { s, e, d } structure, converted to:", numValue);
      }
    } else {
      // Generic object - try toString()
      numValue = Number(String(value)) || 0;
    }
  } else if (typeof value === "string") {
    // Parse string numbers (e.g., "123.45" from serialized API)
    numValue = parseFloat(value);
  } else {
    // Native number type
    numValue = value as number;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[formatCurrency] Final numValue:", numValue, "isNaN:", isNaN(numValue));
  }

  return isNaN(numValue) ? "—" : `৳${numValue.toLocaleString()}`;
};

interface TaxToNBRTableProps {
  data: TaxToNBRItem[];
  isLoading?: boolean;
  userRole?: string;
  onEdit?: (record: TaxToNBRItem) => void;
  onView?: (record: TaxToNBRItem) => void;
  onDelete?: (ids: string[]) => Promise<void>;
  onExport?: (ids?: string[]) => Promise<Blob>;
  pageIndex?: number;
  pageSize?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function TaxToNBRDataTable({
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
}: TaxToNBRTableProps) {
  // Check user permissions
  const canUpdate = canUpdateTaxToNBR(userRole as UserRole);
  const canDelete = canDeleteTaxToNBR(userRole as UserRole);
  const columns: ColumnDef<TaxToNBRItem>[] = React.useMemo(
    () => [
      {
        id: "select",
        size: 40,
        enableHiding: false,
      },
      {
        accessorKey: "memberId",
        header: "Member ID",
        size: 120,
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-xs">
            {row.original.memberId || "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "contractNumber",
        header: "Contract Number",
        size: 140,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            {row.original.contractNumber || "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "trecHolderName",
        header: "TREC Holder",
        size: 160,
      },
      {
        accessorKey: "deducteeTIN",
        header: "Deductee TIN",
        size: 120,
        cell: ({ row }) =>
          row.original.deducteeTIN ? (
            <Badge variant="secondary" className="font-mono text-xs">
              {row.original.deducteeTIN}
            </Badge>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "mobileNumber",
        header: "Mobile",
        size: 120,
      },
      {
        accessorKey: "emailAddress",
        header: "Email",
        size: 180,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.emailAddress || "—"}
          </span>
        ),
      },
      {
        accessorKey: "paymentDate",
        header: "Payment Date",
        size: 120,
        cell: ({ row }) =>
          row.original.paymentDate
            ? new Date(row.original.paymentDate).toLocaleDateString()
            : "—",
      },
      {
        accessorKey: "tradeVolume",
        header: "Trade Volume",
        size: 120,
        cell: ({ row }) => formatCurrency(row.original.tradeVolume),
      },
      {
        accessorKey: "cseCommission",
        header: "CSE Commission",
        size: 130,
        cell: ({ row }) => formatCurrency(row.original.cseCommission),
      },
      {
        accessorKey: "paymentAmount",
        header: "Payment Amount",
        size: 130,
        cell: ({ row }) => formatCurrency(row.original.paymentAmount),
      },
    ],
    []
  );

  return (
    <TanstackDataTable<TaxToNBRItem>
      columns={columns}
      data={data}
      title="Tax to NBR Records"
      description="Manage and view all tax to NBR records"
      searchKeys={["memberId", "contractNumber", "trecHolderName", "deducteeTIN", "mobileNumber"]}
      filters={[
        {
          field: "paymentDate",
          label: "Payment Date",
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
              getRowId: (row) => (row as TaxToNBRItem).id,
            }
          : undefined
      }
      renderRowActions={(item: TaxToNBRItem) =>
        onEdit && canUpdate ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            title="Edit Tax to NBR"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null
      }
    />
  );
}
