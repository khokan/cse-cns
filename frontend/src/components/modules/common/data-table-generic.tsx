"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal, Plus, Text } from "lucide-react";
import * as React from "react";
import { DataTable } from "@/components/modules/data-table/data-table";
import { DataTableColumnHeader } from "@/components/modules/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/modules/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateFormatter, getColumnLabel } from "@/components/modules/data-table/data-table-helpers";
import {
  DataTableRowDialog,
  DataTableFieldSchema,
} from "@/components/modules/data-table/data-table-row-dialog";

export type DataTableGenericProps = {
  /** The underlying database table name (used for labels & the create/edit dialog). */
  table: string;
  rows: Record<string, unknown>[];
  primaryKey: string;
  canWrite: boolean;
  isLoading?: boolean;
  /** Total number of pages available on the server, for manual pagination. */
  pageCount: number;
  onRefresh?: () => void;
  onCreate?: (payload: Record<string, unknown>) => void;
  onUpdate?: (id: string, payload: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  isSubmitting?: boolean;
};

/**
 * A fully dynamic CRUD data table built entirely from the `data-table/*`
 * primitives (not the legacy `dataTable/*` folder). Column definitions are
 * derived at runtime from the shape of `rows`, and pagination / sorting /
 * column-visibility / per-column text filters are all driven by
 * `useDataTable` (backed by URL query params via `nuqs`), giving:
 *
 *  - Search: a per-column text filter (via the toolbar) on every data column.
 *  - Filtering: each data column is a `variant: "text"` filterable column,
 *    rendered by `DataTableToolbar` as a filter input, with a "Reset" button
 *    when any filter is active.
 *  - Sorting: enabled on every data column via `DataTableColumnHeader`.
 *  - Column visibility: `DataTableViewOptions` (rendered inside the
 *    toolbar) lets users toggle which data columns are shown.
 */
export function DataTableGeneric({
  table: tableName,
  rows,
  primaryKey,
  canWrite,
  isLoading,
  pageCount,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  isSubmitting,
}: DataTableGenericProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<
    Record<string, unknown> | undefined
  >();

  // Accumulate column keys over time so they don't disappear during
  // intermediate empty-rows states (e.g. loading, refetch).
  const knownKeysRef = React.useRef<string[]>([]);
  const [keys, setKeys] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (rows.length === 0) return;
    const existing = new Set(knownKeysRef.current);
    const prev = existing.size;
    rows.forEach((row) => Object.keys(row).forEach((k) => existing.add(k)));
    if (existing.size !== prev) {
      const updated = Array.from(existing);
      knownKeysRef.current = updated;
      setKeys(updated);
    }
  }, [rows]);

  const fields: DataTableFieldSchema[] = React.useMemo(
    () =>
      keys.map((key) => ({
        key,
        label: key,
        readOnly: key === primaryKey,
      })),
    [keys, primaryKey]
  );

  const handleEdit = React.useCallback((row: Record<string, unknown>) => {
    setEditingRow(row);
    setDialogOpen(true);
  }, []);

  const handleCreate = React.useCallback(() => {
    setEditingRow(undefined);
    setDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    (row: Record<string, unknown>) => {
      if (!primaryKey) return;
      const id = String(row[primaryKey]);
      if (window.confirm("Are you sure you want to delete this row?")) {
        onDelete?.(id);
      }
    },
    [primaryKey, onDelete]
  );

  const handleSubmit = React.useCallback(
    (payload: Record<string, unknown>) => {
      if (editingRow && primaryKey) {
        const id = String(editingRow[primaryKey]);
        onUpdate?.(id, payload);
      } else {
        onCreate?.(payload);
      }
      setDialogOpen(false);
    },
    [editingRow, primaryKey, onUpdate, onCreate]
  );

  const columns = React.useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const dataColumns: ColumnDef<Record<string, unknown>>[] = keys.map(
      (key) => {
        const columnLabel = getColumnLabel({ id: key });
        return {
          id: key,
          accessorKey: key,
          accessorFn: (row) => (row as Record<string, unknown>)[key],
          header: ({ column }: { column: Column<Record<string, unknown>, unknown> }) => (
            <DataTableColumnHeader column={column} label={columnLabel} />
          ),
          cell: ({ getValue }: { getValue: () => unknown }) =>
            DateFormatter.cell(getValue()),
          enableHiding: true,
          enableSorting: true,
          enableColumnFilter: true,
          meta: {
            label: columnLabel,
            placeholder: `Search ${key}...`,
            variant: "text",
            icon: Text,
          },
        };
      }
    );

    // Debug: Log created columns
    console.log("🛠️ DataTableGeneric - Column Definitions Created:");
    console.log("📊 Data columns:", dataColumns.map(col => ({
      id: col.id,
      label: (col.meta as Record<string, unknown>)?.label,
      enableHiding: col.enableHiding,
    })));

    const selectColumn: ColumnDef<Record<string, unknown>> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 32,
      enableSorting: false,
      enableHiding: false,
    };

    const actionsColumn: ColumnDef<Record<string, unknown>> = {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleDelete(row.original)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 32,
      enableHiding: false,
    };

    return canWrite
      ? [selectColumn, ...dataColumns, actionsColumn]
      : [selectColumn, ...dataColumns];
  }, [keys, canWrite, handleEdit, handleDelete]);

  const { table } = useDataTable({
    data: rows,
    columns,
    pageCount: Math.max(1, pageCount),
    getRowId: (row) => String(row[primaryKey]),
    initialState: {
      columnPinning: { right: canWrite ? ["actions"] : [] },
      columnVisibility: {
        // Ensure all data columns start as visible
        ...Object.fromEntries(keys.map((key) => [key, true])),
      },
    },
  });

  return (
    <div className="data-table-container space-y-4">
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Refresh
            </Button>
          )}
          {canWrite && onCreate && (
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-1 h-4 w-4" /> Create
            </Button>
          )}
        </DataTableToolbar>
      </DataTable>

      <DataTableRowDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        table={tableName}
        fields={fields}
        initialData={editingRow}
        primaryKey={primaryKey}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
