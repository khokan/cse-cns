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
  VisibilityState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns3,
  SlidersHorizontal,
  X,
  FilterX,
  RotateCcw,
  Maximize2,
  Minimize2,
  Trash2,
  Download,
  Database,
  AlignJustify,
} from "lucide-react";
import {
  analyzeAllColumnsData,
  getInitialColumnVisibility,
  getColumnLabel,
  ColumnDataPresence,
} from "./tanstack-table-helpers";

// ---------------------------------------------------------------------------
// Component Types
// ---------------------------------------------------------------------------
export type TableDensity = "compact" | "comfortable" | "spacious";

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

  // Enhancements
  hideEmptyColumnsInitially?: boolean;
  showColumnVisibility?: boolean;
  showDensitySelector?: boolean;
  defaultDensity?: TableDensity;
  enableZebraStripes?: boolean;
  stickyHeader?: boolean;
  onRowClick?: (item: T) => void;
  topRightActions?: React.ReactNode;

  // Server-side (manual) pagination support. When enabled, the `data` prop
  // is expected to contain only the current page's rows, and pagination
  // controls are driven by `pageIndex`/`pageSize`/`totalRecords` instead of
  // computing pagination over `data.length` locally.
  manualPagination?: boolean;
  pageIndex?: number;
  pageSize?: number;
  totalRecords?: number;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

const DENSITY_STYLES: Record<TableDensity, { cell: string; header: string; action: string }> = {
  compact: {
    cell: "py-1.5 px-2.5 text-xs leading-snug",
    header: "py-1.5 px-2.5 text-xs font-semibold",
    action: "h-7 px-2 text-xs",
  },
  comfortable: {
    cell: "py-2.5 px-3 text-sm leading-normal",
    header: "py-2 px-3 text-sm font-semibold",
    action: "h-8 px-3 text-xs",
  },
  spacious: {
    cell: "py-3.5 px-4 text-sm leading-relaxed",
    header: "py-3 px-4 text-sm font-semibold",
    action: "h-9 px-3 text-sm",
  },
};

function isMatch(value: unknown, query: string) {
  if (value === undefined || value === null) return false;
  return String(value).toLowerCase().includes(query);
}

// ---------------------------------------------------------------------------
// DataTableViewOptions (Column Visibility Menu with Data Presence Badges)
// ---------------------------------------------------------------------------
function DataTableViewOptions<T extends object>({
  table,
  dataAnalysis,
}: {
  table: ReturnType<typeof useReactTable<T>>;
  dataAnalysis: Record<string, ColumnDataPresence>;
}) {
  const [columnSearch, setColumnSearch] = React.useState("");

  const hideableColumns = React.useMemo(() => {
    return table
      .getAllColumns()
      .filter(
        (column) =>
          typeof column.accessorFn !== "undefined" && column.getCanHide()
      );
  }, [table]);

  const filteredColumns = React.useMemo(() => {
    if (!columnSearch.trim()) return hideableColumns;
    const q = columnSearch.toLowerCase();
    return hideableColumns.filter((col) =>
      getColumnLabel(col).toLowerCase().includes(q)
    );
  }, [hideableColumns, columnSearch]);

  const visibleCount = hideableColumns.filter((col) => col.getIsVisible()).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium border-border/80 shadow-xs">
          <Columns3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Columns</span>
          <Badge
            variant="secondary"
            className="ml-0.5 h-4 px-1 text-[10px] font-semibold bg-muted text-muted-foreground"
          >
            {visibleCount}/{hideableColumns.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2 shadow-md">
        <DropdownMenuLabel className="flex items-center justify-between text-xs font-semibold text-muted-foreground pb-1 px-1">
          <span>Toggle Columns</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1 text-[10px] text-primary hover:text-primary/80"
              onClick={() => table.toggleAllColumnsVisible(true)}
            >
              Show All
            </Button>
            <span className="text-muted-foreground/40">•</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => table.toggleAllColumnsVisible(false)}
            >
              Hide All
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        {hideableColumns.length > 5 && (
          <div className="px-1 py-1">
            <Input
              placeholder="Search columns..."
              value={columnSearch}
              onChange={(e) => setColumnSearch(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        )}

        <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
          {filteredColumns.map((column) => {
            const label = getColumnLabel(column);
            const presence = dataAnalysis[column.id];

            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize text-xs flex items-center justify-between py-1.5 px-2 cursor-pointer"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                <span className="truncate pr-2 font-medium">{label}</span>
                {presence ? (
                  presence.hasData ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 h-4 px-1 text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    >
                      {presence.populatedCount} rows
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="shrink-0 h-4 px-1 text-[9px] font-mono text-muted-foreground/60 bg-muted/30 border-muted-foreground/20"
                    >
                      Empty
                    </Badge>
                  )
                ) : null}
              </DropdownMenuCheckboxItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// DataTablePagination Component
// ---------------------------------------------------------------------------
function DataTablePagination<T extends object>({
  table,
  pageSizeOptions,
  totalRecords,
}: {
  table: ReturnType<typeof useReactTable<T>>;
  pageSizeOptions: number[];
  totalRecords: number;
}) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();

  const startRecord = totalRecords === 0 ? 0 : pageIndex * pageSize + 1;
  const endRecord = Math.min((pageIndex + 1) * pageSize, totalRecords);

  // Generate page numbers to render
  const pageNumbers = React.useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (pageCount <= maxVisible) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      let start = Math.max(0, pageIndex - 1);
      let end = Math.min(pageCount - 1, pageIndex + 1);

      if (pageIndex <= 1) {
        end = Math.min(pageCount - 1, maxVisible - 1);
      } else if (pageIndex >= pageCount - 2) {
        start = Math.max(0, pageCount - maxVisible);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  }, [pageCount, pageIndex]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-2 text-xs text-muted-foreground">
      {/* Total records info */}
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-foreground font-semibold">{startRecord}</strong> to{" "}
          <strong className="text-foreground font-semibold">{endRecord}</strong> of{" "}
          <strong className="text-foreground font-semibold">{totalRecords}</strong> entries
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
        {/* Page size selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => table.setPageSize(Number(val))}
          >
            <SelectTrigger className="h-7 w-16 text-xs border-border/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((sz) => (
                <SelectItem key={sz} value={String(sz)} className="text-xs">
                  {sz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-border/70"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-border/70"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-1">
            {pageNumbers[0] > 0 && (
              <>
                <Button
                  variant={pageIndex === 0 ? "default" : "outline"}
                  size="sm"
                  className="h-7 min-w-7 px-2 text-xs border-border/70"
                  onClick={() => table.setPageIndex(0)}
                >
                  1
                </Button>
                {pageNumbers[0] > 1 && (
                  <span className="px-0.5 text-muted-foreground/60">...</span>
                )}
              </>
            )}

            {pageNumbers.map((p) => (
              <Button
                key={p}
                variant={pageIndex === p ? "default" : "outline"}
                size="sm"
                className={`h-7 min-w-7 px-2 text-xs ${
                  pageIndex === p
                    ? "bg-primary text-primary-foreground font-medium shadow-xs"
                    : "border-border/70 text-foreground"
                }`}
                onClick={() => table.setPageIndex(p)}
              >
                {p + 1}
              </Button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < pageCount - 1 && (
              <>
                {pageNumbers[pageNumbers.length - 1] < pageCount - 2 && (
                  <span className="px-0.5 text-muted-foreground/60">...</span>
                )}
                <Button
                  variant={pageIndex === pageCount - 1 ? "default" : "outline"}
                  size="sm"
                  className="h-7 min-w-7 px-2 text-xs border-border/70"
                  onClick={() => table.setPageIndex(pageCount - 1)}
                >
                  {pageCount}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-border/70"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-border/70"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            title="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Table Loader
// ---------------------------------------------------------------------------
function DataTableSkeleton({
  columnsCount,
  rowsCount = 5,
  density = "compact",
}: {
  columnsCount: number;
  rowsCount?: number;
  density?: TableDensity;
}) {
  const densityClass = DENSITY_STYLES[density].cell;

  return (
    <TableBody>
      {Array.from({ length: rowsCount }).map((_, rIdx) => (
        <TableRow key={rIdx} className="border-b border-border/30">
          {Array.from({ length: columnsCount }).map((_, cIdx) => (
            <TableCell key={cIdx} className={densityClass}>
              <Skeleton className="h-4 w-full rounded max-w-[85%]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

// ---------------------------------------------------------------------------
// Main TanstackDataTable Component
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Stable empty defaults — defined outside the component so their reference
// never changes between renders (avoids triggering useMemo/useEffect).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EMPTY_ARRAY: any[] = [];
const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export function TanstackDataTable<T extends object>({
  columns,
  data,
  title,
  description,
  searchKeys,
  filters,
  initialPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  renderRowActions,
  noDataText = "No records match your current criteria.",
  bulkActions,
  isLoading = false,

  hideEmptyColumnsInitially = true,
  showColumnVisibility = true,
  showDensitySelector = true,
  defaultDensity = "compact",
  enableZebraStripes = false,
  stickyHeader = false,
  onRowClick,
  topRightActions,

  manualPagination = false,
  pageIndex: controlledPageIndex,
  pageSize: controlledPageSize,
  totalRecords: controlledTotalRecords,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  // Stable empty fallbacks resolved inside the function (where T is known).
  // Using a module-level EMPTY_ARRAY cast here keeps the reference stable
  // across renders, avoiding spurious useMemo/useEffect re-runs.
  const stableSearchKeys = (searchKeys ?? EMPTY_ARRAY) as (keyof T & string)[];
  const stableFilters = (filters ?? EMPTY_ARRAY) as DataTableFilterField<T>[];

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [searchValue, setSearchValue] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    stableFilters.forEach((f) => {
      defaults[f.field] = "all";
    });
    return defaults;
  });

  const [density, setDensity] = React.useState<TableDensity>(defaultDensity);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Stable refs — always hold latest prop values without triggering re-renders
  const columnsRef = React.useRef(columns);
  columnsRef.current = columns;
  const searchKeysRef = React.useRef(stableSearchKeys);
  searchKeysRef.current = stableSearchKeys;
  const filtersRef = React.useRef(stableFilters);
  filtersRef.current = stableFilters;

  // Analyze dataset column presence (only re-runs when data changes, not columns ref)
  const dataAnalysis = React.useMemo(() => {
    return analyzeAllColumnsData(data, columnsRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Track whether we've done the initial visibility evaluation
  const hasEvaluatedVisibility = React.useRef(false);

  // Initial column visibility state — runs once synchronously on first render
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    if (hideEmptyColumnsInitially && data.length > 0) {
      hasEvaluatedVisibility.current = true;
      return getInitialColumnVisibility(data, columns, true);
    }
    return {};
  });

  // Re-evaluate visibility ONCE when data transitions from empty → non-empty
  // Uses a ref for columns to avoid columns reference churn re-triggering this
  React.useEffect(() => {
    if (hideEmptyColumnsInitially && data.length > 0 && !hasEvaluatedVisibility.current) {
      hasEvaluatedVisibility.current = true;
      const initial = getInitialColumnVisibility(data, columnsRef.current, true);
      if (Object.keys(initial).length > 0) {
        setColumnVisibility(initial);
      }
    }
    // Only react to data and hideEmptyColumnsInitially — never columns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, hideEmptyColumnsInitially]);

  // Filtered dataset logic — uses refs for searchKeys/filters so inline array
  // literals passed by callers don't cause this to recompute on every render.
  const filteredData = React.useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const keys = searchKeysRef.current;
    const activeFilters = filtersRef.current;

    return data.filter((item) => {
      const searchMatch =
        !normalizedSearch ||
        keys.length === 0 ||
        keys.some((key) => isMatch(item[key], normalizedSearch));

      const filterMatch = activeFilters.every((filter) => {
        const activeValue = filterValues[filter.field];
        if (!activeValue || activeValue === "all") {
          return true;
        }
        return String(item[filter.field]) === activeValue;
      });

      return searchMatch && filterMatch;
    });
    // searchKeys and filters are read from refs — stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, searchValue, filterValues]);

  // In manual (server-side) pagination mode, `data` already represents just
  // the current page fetched from the server, so we skip local filtering.
  const effectiveData = manualPagination ? data : filteredData;

  // Uncontrolled pagination fallback state — used only when manualPagination
  // is enabled but the caller doesn't fully control pageIndex/pageSize.
  const [uncontrolledPageIndex, setUncontrolledPageIndex] = React.useState(0);
  const [uncontrolledPageSize, setUncontrolledPageSize] = React.useState(initialPageSize);

  const currentPageIndex = manualPagination
    ? controlledPageIndex ?? uncontrolledPageIndex
    : undefined;
  const currentPageSize = manualPagination
    ? controlledPageSize ?? uncontrolledPageSize
    : undefined;
  const currentTotalRecords = manualPagination
    ? controlledTotalRecords ?? data.length
    : effectiveData.length;

  const handlePaginationChange = React.useCallback(
    (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      const prev = {
        pageIndex: currentPageIndex ?? 0,
        pageSize: currentPageSize ?? initialPageSize,
      };
      const next = typeof updater === "function" ? updater(prev) : updater;

      if (next.pageIndex !== prev.pageIndex) {
        if (onPageChange) onPageChange(next.pageIndex);
        else setUncontrolledPageIndex(next.pageIndex);
      }
      if (next.pageSize !== prev.pageSize) {
        if (onPageSizeChange) onPageSizeChange(next.pageSize);
        else setUncontrolledPageSize(next.pageSize);
        // Changing page size should reset to first page
        if (onPageChange) onPageChange(0);
        else setUncontrolledPageIndex(0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPageIndex, currentPageSize, initialPageSize, onPageChange, onPageSizeChange]
  );

  // Table setup
  const table = useReactTable({
    data: effectiveData,
    columns,
    state: {
      sorting,
      columnVisibility,
      ...(manualPagination
        ? {
            pagination: {
              pageIndex: currentPageIndex ?? 0,
              pageSize: currentPageSize ?? initialPageSize,
            },
          }
        : {}),
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(manualPagination
      ? {
          manualPagination: true,
          pageCount: Math.max(
            1,
            Math.ceil((currentTotalRecords || 0) / (currentPageSize || initialPageSize))
          ),
          onPaginationChange: handlePaginationChange,
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: {
            pagination: {
              pageIndex: 0,
              pageSize: initialPageSize,
            },
          },
        }),
  });

  // Stable ref to table.setPageIndex to call without including table in deps
  const setPageIndexRef = React.useRef(table.setPageIndex);
  setPageIndexRef.current = table.setPageIndex;

  // Reset pagination to page 1 on search or filter change (no table in deps)
  // Only applies in local (non-manual) pagination mode — in manual mode the
  // caller is responsible for resetting the page (e.g. on search changes).
  React.useEffect(() => {
    if (!manualPagination) {
      setPageIndexRef.current(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, filterValues, manualPagination]);

  // Active filters helper
  const activeFiltersCount = React.useMemo(() => {
    let count = searchValue.trim() ? 1 : 0;
    Object.values(filterValues).forEach((val) => {
      if (val && val !== "all") count++;
    });
    return count;
  }, [searchValue, filterValues]);

  const handleResetFilters = () => {
    setSearchValue("");
    const resetValues: Record<string, string> = {};
    filtersRef.current.forEach((f) => {
      resetValues[f.field] = "all";
    });
    setFilterValues(resetValues);
  };

  // Bulk actions handlers
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

  const visibleRows = table.getRowModel().rows;
  const currentDensityStyles = DENSITY_STYLES[density];
  const totalColumnCount =
    table.getVisibleFlatColumns().length +
    (renderRowActions ? 1 : 0) +
    (bulkActions ? 1 : 0);

  return (
    <Card className="rounded-xl border border-border/60 shadow-xs bg-card overflow-hidden">
      {/* Header section if title/description provided */}
      {(title || description || topRightActions) && (
        <CardHeader className="border-b border-border/60 pb-3.5 pt-4 px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              {title ? (
                <CardTitle className="text-lg font-bold bg-linear-to-r from-emerald-500 via-primary to-secondary bg-clip-text text-transparent">
                  {title}
                </CardTitle>
              ) : null}
              {description ? (
                <CardDescription className="text-xs text-muted-foreground">
                  {description}
                </CardDescription>
              ) : null}
            </div>
            {topRightActions ? (
              <div className="flex items-center gap-2">{topRightActions}</div>
            ) : null}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Toolbar & Filter Bar */}
        <div className="flex flex-col gap-2.5">
          {/* Main Controls Row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search input */}
              {stableSearchKeys.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search records..."
                    className="pl-8 pr-8 h-8 text-xs border-border/80 shadow-xs"
                  />
                  {searchValue && (
                    <button
                      onClick={() => setSearchValue("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Dynamic Filter Dropdowns */}
              {stableFilters.map((filter) => (
                <Select
                  key={filter.field}
                  value={filterValues[filter.field] ?? "all"}
                  onValueChange={(val) =>
                    setFilterValues((prev) => ({ ...prev, [filter.field]: val }))
                  }
                >
                  <SelectTrigger className="w-40 h-8 text-xs border-border/80 shadow-xs">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All {filter.label}
                    </SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>

            {/* Right Controls: Column Visibility & Density */}
            <div className="flex items-center justify-end gap-2 shrink-0">
              {/* Column Visibility Selector */}
              {showColumnVisibility && (
                <DataTableViewOptions table={table} dataAnalysis={dataAnalysis} />
              )}

              {/* Density Selector */}
              {showDensitySelector && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-xs font-medium border-border/80 shadow-xs capitalize"
                    >
                      <AlignJustify className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">{density}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                      Density
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDensity("compact")}
                      className="text-xs justify-between cursor-pointer"
                    >
                      Compact {density === "compact" && "✓"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDensity("comfortable")}
                      className="text-xs justify-between cursor-pointer"
                    >
                      Comfortable {density === "comfortable" && "✓"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDensity("spacious")}
                      className="text-xs justify-between cursor-pointer"
                    >
                      Spacious {density === "spacious" && "✓"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Active Filter Chips / Badges */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between bg-muted/30 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="h-3 w-3" /> Active Filters:
                </span>

                {searchValue && (
                  <Badge
                    variant="secondary"
                    className="h-5 gap-1 text-[11px] font-normal bg-background border border-border/60"
                  >
                    Search: &quot;{searchValue}&quot;
                    <button onClick={() => setSearchValue("")} className="hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {stableFilters.map((filter) => {
                  const val = filterValues[filter.field];
                  if (!val || val === "all") return null;
                  const label =
                    filter.options.find((o) => o.value === val)?.label || val;
                  return (
                    <Badge
                      key={filter.field}
                      variant="secondary"
                      className="h-5 gap-1 text-[11px] font-normal bg-background border border-border/60"
                    >
                      {filter.label}: {label}
                      <button
                        onClick={() =>
                          setFilterValues((prev) => ({ ...prev, [filter.field]: "all" }))
                        }
                        className="hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Clear all
              </Button>
            </div>
          )}

          {/* Bulk action toolbar */}
          {selectedRows.size > 0 && bulkActions && (
            <div className="bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/30 rounded-lg px-3 py-2 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-medium text-[11px]">
                  {selectedRows.size} selected
                </Badge>
                <span className="text-muted-foreground hidden sm:inline">
                  Select records to apply bulk actions
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {bulkActions.onExport && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkExport}
                    disabled={isExporting}
                    className="gap-1 h-7 text-xs border-blue-500/30 hover:bg-blue-500/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isExporting ? "Exporting..." : "Export"}
                  </Button>
                )}
                {bulkActions.onDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="gap-1 h-7 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Table Container */}
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
                              setSelectedRows(allRowIds);
                            } else {
                              setSelectedRows(new Set());
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
                <DataTableSkeleton
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
                                  setSelectedRows(next);
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
                      <TableCell
                        colSpan={totalColumnCount}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-muted-foreground">
                          <FilterX className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm font-medium text-foreground">{noDataText}</p>
                          {activeFiltersCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetFilters}
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

        {/* Pagination Section */}
        {!isLoading && filteredData.length > 0 && (
          <DataTablePagination
            table={table}
            pageSizeOptions={pageSizeOptions}
            totalRecords={filteredData.length}
          />
        )}

        {/* Bulk Delete Confirm Modal */}
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
