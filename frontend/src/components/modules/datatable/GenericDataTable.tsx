"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TanstackDataTable } from "@/components/modules/common/tanstack-data-table";
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
};

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

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
}: GenericDataTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | undefined>();

  const keys = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((k) => set.add(k)));
    return Array.from(set);
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
    const cols = keys.map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue }: { getValue: () => unknown }) => formatCellValue(getValue()),
    }));
    return cols;
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
          <h2 className="text-lg font-semibold capitalize">{table}</h2>
          <p className="text-sm text-muted-foreground">
            {rows.length} row{rows.length === 1 ? "" : "s"} loaded
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
        noDataText={isLoading ? "Loading..." : "No records found."}
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
