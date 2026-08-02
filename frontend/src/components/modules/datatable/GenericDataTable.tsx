"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TanstackDataTable } from "@/components/modules/dataTable/tanstack-data-table";
import { DateFormatter } from "@/utils/tanstack-table-helpers";
import {
  RowCreateEditDialog,
  FieldSchema,
} from "./RowCreateEditDialog";

export type GenericDataTableProps = {
  table: string;
  rows: Record<string, unknown>[];
  primaryKey: string;
  canWrite: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  onCreate?: (payload: Record<string, unknown>) => void;
  onUpdate?: (id: string, payload: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  isSubmitting?: boolean;

  // Server-side pagination props (optional). When provided, the underlying
  // TanstackDataTable switches to manual pagination mode so tables with
  // thousands of rows (e.g. taxToNBR) page correctly against the server
  // instead of only ever showing the first fetched page.
  pageIndex?: number;
  pageSize?: number;
  totalRecords?: number;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export function GenericDataTable({
  table,
  rows,
  primaryKey,
  canWrite,
  isLoading,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  isSubmitting,
  pageIndex,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
}: GenericDataTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | undefined>();

  // Accumulate column keys over time so they don't disappear during
  // intermediate empty-rows states (e.g. loading, refetch).
  const knownKeysRef = useRef<string[]>([]);
  
  // Initialize keys from rows - start with empty and populate from first render with data
  const [keys, setKeys] = useState<string[]>([]);

  // On mount and when rows change, sync keys
  useEffect(() => {
    if (rows.length === 0) {
      return;
    }
    
    const existing = new Set(knownKeysRef.current);
    const prev = existing.size;
    rows.forEach((row) => Object.keys(row).forEach((k) => existing.add(k)));
    
    if (existing.size !== prev) {
      const updated = Array.from(existing);
      knownKeysRef.current = updated;
      setKeys(updated);
    }
  }, [rows]);

  const fields: FieldSchema[] = useMemo(
    () =>
      keys.map((key) => ({
        key,
        label: key,
        readOnly: key === primaryKey,
      })),
    [keys, primaryKey]
  );

  const columns: ColumnDef<Record<string, unknown>>[] = useMemo(() => {
    return keys.map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue }: { getValue: () => unknown }) =>
        DateFormatter.cell(getValue()),
      enableHiding: true,
    }));
  }, [keys]);

  const handleEdit = (row: Record<string, unknown>) => {
    setEditingRow(row);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingRow(undefined);
    setDialogOpen(true);
  };

  const handleSubmit = (payload: Record<string, unknown>) => {
    if (editingRow && primaryKey) {
      const id = String(editingRow[primaryKey]);
      onUpdate?.(id, payload);
    } else {
      onCreate?.(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = (row: Record<string, unknown>) => {
    if (!primaryKey) return;
    const id = String(row[primaryKey]);
    if (window.confirm("Are you sure you want to delete this row?")) {
      onDelete?.(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {totalRecords ?? rows.length} row{(totalRecords ?? rows.length) === 1 ? "" : "s"}{" "}
            {totalRecords !== undefined ? "total" : "loaded"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          )}
          {canWrite && onCreate && (
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-1 h-4 w-4" /> Create
            </Button>
          )}
        </div>
      </div>

      <TanstackDataTable
        columns={columns}
        data={rows}
        title=""
        searchKeys={keys}
        isLoading={isLoading}
        hideEmptyColumnsInitially={false}
        noDataText={isLoading ? "Loading..." : "No records found."}
        manualPagination={onPageChange !== undefined}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        renderRowActions={
          canWrite
            ? (row) => (
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )
            : undefined
        }
      />

      <RowCreateEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        table={table}
        fields={fields}
        initialData={editingRow}
        primaryKey={primaryKey}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
