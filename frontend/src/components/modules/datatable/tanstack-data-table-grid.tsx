"use client";

import * as React from "react";
import {
  Cell,
  flexRender,
  Header,
  HeaderGroup,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FilterX,
  RotateCcw,
} from "lucide-react";
import { TanstackDataTableSkeleton } from "./tanstack-data-table-skeleton";
import { DataTableBulkAction, TableDensity, DENSITY_STYLES } from "./tanstack-data-table.types";

// ---------------------------------------------------------------------------
// Renders the <Table> element: header row (with sorting/checkbox), body rows
// (with selection/zebra striping/row actions), skeleton loading state, and
// the "no results" empty state.
// ---------------------------------------------------------------------------
export function TanstackDataTableGrid<T extends object>({
  table,
  isLoading,
  density,
  stickyHeader,
  enableZebraStripes,
  bulkActions,
  renderRowActions,
  onRowClick,
  selectedRows,
  onSelectedRowsChange,
  noDataText,
  activeFiltersCount,
  onResetFilters,
}: {
  table: ReturnType<typeof useReactTable<T>>;
  isLoading: boolean;
  density: TableDensity;
  stickyHeader: boolean;
  enableZebraStripes: boolean;
  bulkActions?: DataTableBulkAction<T>;
  renderRowActions?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  selectedRows: Set<string>;
  onSelectedRowsChange: (next: Set<string>) => void;
  noDataText: string;
  activeFiltersCount: number;
  onResetFilters: () => void;
}) {
  const currentDensityStyles = DENSITY_STYLES[density];
  const visibleRows = table.getRowModel().rows;
  const totalColumnCount =
    table.getVisibleFlatColumns().length +
    (renderRowActions ? 1 : 0) +
    (bulkActions ? 1 : 0);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className={`bg-muted/40 ${stickyHeader ? "sticky top-0 z-10 backdrop-blur-xs" : ""}`}>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<T>) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border/60">
                {/* Checkbox column */}
                {bulkActions && (
                  <TableHead className={`${currentDensityStyles.header} w-10 text-center`}>
                    <Checkbox
                      checked={visibleRows.length > 0 && selectedRows.size === visibleRows.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const allRowIds = new Set(
                            visibleRows.map(
                              (row) => bulkActions.getRowId?.(row.original) || row.id
                            )
                          );
                          onSelectedRowsChange(allRowIds);
                        } else {
                          onSelectedRowsChange(new Set());
                        }
                      }}
                    />
                  </TableHead>
                )}

                {/* Data Headers */}
                {headerGroup.headers.map((header: Header<T, unknown>) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id} className={`${currentDensityStyles.header} text-left`}>
                      {header.isPlaceholder ? null : (
                        <div
                          onClick={() => {
                            if (canSort) {
                              header.column.toggleSorting();
                            }
                          }}
                          className={
                            canSort
                              ? "flex items-center gap-1.5 font-semibold text-foreground/90 cursor-pointer hover:text-foreground select-none transition-colors group"
                              : "flex items-center gap-1.5 font-semibold text-foreground/90"
                          }
                        >
                          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                          {canSort && (
                            <div className="shrink-0 flex items-center">
                              {isSorted === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-primary font-bold" />
                              ) : isSorted === "desc" ? (
                                <ArrowDown className="h-3 w-3 text-primary font-bold" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-70 transition-opacity" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}

                {/* Row Actions Header */}
                {renderRowActions ? (
                  <TableHead className={`${currentDensityStyles.header} text-right w-20`}>
                    Actions
                  </TableHead>
                ) : null}
              </TableRow>
            ))}
          </TableHeader>

          {/* Table Body */}
          {isLoading ? (
            <TanstackDataTableSkeleton
              columnsCount={totalColumnCount}
              rowsCount={table.getState().pagination.pageSize || 5}
              density={density}
            />
          ) : (
            <TableBody>
              {visibleRows.length ? (
                visibleRows.map((row: Row<T>, rIdx: number) => {
                  const isSelected = selectedRows.has(
                    bulkActions?.getRowId?.(row.original) || row.id
                  );

                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => onRowClick?.(row.original)}
                      className={`border-b border-border/30 transition-colors ${
                        onRowClick ? "cursor-pointer" : ""
                      } ${
                        isSelected
                          ? "bg-blue-500/10 dark:bg-blue-950/30"
                          : enableZebraStripes && rIdx % 2 === 1
                          ? "bg-muted/20 hover:bg-muted/40"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      {/* Checkbox Cell */}
                      {bulkActions && (
                        <TableCell
                          className={`${currentDensityStyles.cell} w-10 text-center`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const rowId =
                                bulkActions.getRowId?.(row.original) || row.id;
                              const next = new Set(selectedRows);
                              if (checked) next.add(rowId);
                              else next.delete(rowId);
                              onSelectedRowsChange(next);
                            }}
                          />
                        </TableCell>
                      )}

                      {/* Dynamic Visible Cells */}
                      {row.getVisibleCells().map((cell: Cell<T, unknown>) => (
                        <TableCell key={cell.id} className={`${currentDensityStyles.cell} align-middle`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}

                      {/* Row Actions Cell */}
                      {renderRowActions ? (
                        <TableCell
                          className={`${currentDensityStyles.cell} text-right`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {renderRowActions(row.original)}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={totalColumnCount} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-muted-foreground">
                      <FilterX className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm font-medium text-foreground">{noDataText}</p>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onResetFilters}
                          className="mt-2 h-7 text-xs gap-1 border-border/70"
                        >
                          <RotateCcw className="h-3 w-3" /> Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>
    </div>
  );
}
