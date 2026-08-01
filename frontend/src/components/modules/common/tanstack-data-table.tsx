"use client";

import * as React from "react";
import {
  Cell,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Header,
  HeaderGroup,
  Row,
  SortingState,
  Updater,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";

export type DataTableFilterOption = {
  label: string;
  value: string;
};

export type DataTableFilterField<T> = {
  field: keyof T & string;
  label: string;
  options: DataTableFilterOption[];
};

export type DataTableBulkAction<T> = {
  onDelete?: (ids: string[]) => Promise<void>;
  onExport?: (ids?: string[]) => Promise<Blob>;
  getRowId?: (row: T) => string;
};

export type DataTableProps<T extends object> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  title?: string;
  description?: string;
  searchKeys?: Array<keyof T & string>;
  filters?: DataTableFilterField<T>[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  renderRowActions?: (item: T) => React.ReactNode;
  noDataText?: string;
  bulkActions?: DataTableBulkAction<T>;
  isLoading?: boolean;
};

function isMatch(value: unknown, query: string) {
  if (value === undefined || value === null) return false;
  return String(value).toLowerCase().includes(query);
}

export function TanstackDataTable<T extends object>({
  columns,
  data,
  title,
  description,
  searchKeys = [],
  filters = [],
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  renderRowActions,
  noDataText = "No records match your current filters.",
  bulkActions,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>(() => {
    const defaultValues: Record<string, string> = {};
    filters.forEach((filter) => {
      defaultValues[filter.field] = "all";
    });
    return defaultValues;
  });

  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const filteredData = React.useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return data.filter((item) => {
      const searchMatch =
        !normalizedSearch ||
        searchKeys.some((key) => isMatch(item[key], normalizedSearch));

      const filterMatch = filters.every((filter) => {
        const activeValue = filterValues[filter.field];
        if (!activeValue || activeValue === "all") {
          return true;
        }
        return String(item[filter.field]) === activeValue;
      });

      return searchMatch && filterMatch;
    });
  }, [data, searchKeys, searchValue, filters, filterValues]);

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0 || !bulkActions?.onDelete) return;

    setIsDeleting(true);
    try {
      const ids = Array.from(selectedRows);
      await bulkActions.onDelete(ids);
      setSelectedRows(new Set());
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkExport = async () => {
    if (!bulkActions?.onExport) return;

    setIsExporting(true);
    try {
      const ids = selectedRows.size > 0 ? Array.from(selectedRows) : undefined;
      const blob = await bulkActions.onExport(ids);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `export-${new Date().getTime()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const table = useReactTable({
    data: filteredData,
    columns,
    pageCount: Math.ceil(filteredData.length / pageSize),
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
      sorting,
    },
    onPaginationChange: (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
      setPageSize(next.pageSize);
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    setPageIndex(0);
  }, [searchValue, filterValues, pageSize]);

  const totalPages = table.getPageCount();
  const visibleRows = table.getRowModel().rows;

  return (
    <Card className="rounded-2xl border border-border/60 shadow-sm">
      {(title || description) && (
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              {title ? <CardTitle className="bg-linear-to-r from-emerald-500 via-primary to-secondary bg-clip-text text-transparent">{title}</CardTitle> : null}
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search records..."
                  className="pl-10"
                />
              </div>
              {filters.map((filter) => (
                <Select key={filter.field} value={filterValues[filter.field] ?? "all"} onValueChange={(value) => setFilterValues((prev) => ({ ...prev, [filter.field]: value }))}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Bulk action toolbar */}
          {selectedRows.size > 0 && bulkActions && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg px-3 py-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedRows.size} selected
                </span>
              </div>
              <div className="flex items-center gap-1">
                {bulkActions.onExport && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkExport}
                    disabled={isExporting}
                    className="gap-1 h-8 text-xs"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {isExporting ? "Exporting..." : "Export"}
                  </Button>
                )}
                {bulkActions.onDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="gap-1 h-8 text-xs"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Filters and search */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
              {filters.map((filter) => (
                <Select key={filter.field} value={filterValues[filter.field] ?? "all"} onValueChange={(value) => setFilterValues((prev) => ({ ...prev, [filter.field]: value }))}>
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>

            {/* Page size selector */}
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">Rows:</span>
              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results info */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
            <div>
              {filteredData.length} record{filteredData.length === 1 ? "" : "s"} found
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup: HeaderGroup<T>) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {bulkActions && (
                      <TableHead className="px-3 py-2 w-10">
                        <Checkbox
                          checked={visibleRows.length > 0 && selectedRows.size === visibleRows.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const allRowIds = new Set(visibleRows.map((row) => bulkActions.getRowId?.(row.original) || row.id));
                              setSelectedRows(allRowIds);
                            } else {
                              setSelectedRows(new Set());
                            }
                          }}
                        />
                      </TableHead>
                    )}
                    {headerGroup.headers.map((header: Header<T, unknown>) => {
                      const canSort = header.column.getCanSort();
                      return (
                        <TableHead key={header.id} className="px-3 py-2 text-left">
                          {header.isPlaceholder ? null : (
                            <div
                              onClick={() => {
                                if (canSort) {
                                  header.column.toggleSorting();
                                }
                              }}
                              className={canSort ? "flex items-center gap-1 font-semibold text-foreground cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded select-none transition-colors" : "flex items-center gap-1 font-semibold text-foreground"}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {canSort && (
                                <div className="ml-auto shrink-0 flex items-center">
                                  {header.column.getIsSorted() === "asc" ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : header.column.getIsSorted() === "desc" ? (
                                    <ArrowDown className="h-3 w-3" />
                                  ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </TableHead>
                      );
                    })}
                    {renderRowActions ? <TableHead className="px-3 py-2 text-right w-20">Actions</TableHead> : null}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {visibleRows.length ? (
                  visibleRows.map((row: Row<T>) => (
                    <TableRow key={row.id} className="hover:bg-muted/50 border-b border-border/30">
                      {bulkActions && (
                        <TableCell className="px-3 py-2 w-10">
                          <Checkbox
                            checked={selectedRows.has(bulkActions.getRowId?.(row.original) || row.id)}
                            onCheckedChange={(checked) => {
                              const rowId = bulkActions.getRowId?.(row.original) || row.id;
                              const newSelectedRows = new Set(selectedRows);
                              if (checked) {
                                newSelectedRows.add(rowId);
                              } else {
                                newSelectedRows.delete(rowId);
                              }
                              setSelectedRows(newSelectedRows);
                            }}
                          />
                        </TableCell>
                      )}
                      {row.getVisibleCells().map((cell: Cell<T, unknown>) => (
                        <TableCell key={cell.id} className="px-3 py-2 text-left align-middle text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                      {renderRowActions ? <TableCell className="px-3 py-2 text-right">{renderRowActions(row.original)}</TableCell> : null}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length + (renderRowActions ? 1 : 0) + (bulkActions ? 1 : 0)} className="py-8 text-center text-muted-foreground">
                      {noDataText}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Page {pageIndex + 1} of {Math.max(totalPages, 1)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        {bulkActions?.onDelete && (
          <ConfirmDialog
            open={showDeleteConfirm}
            title="Delete Records?"
            description={`This will permanently delete ${selectedRows.size} record(s). This action cannot be undone.`}
            destructive
            confirmText="Delete"
            cancelText="Cancel"
            loading={isDeleting}
            icon="warning"
            onConfirm={handleBulkDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
