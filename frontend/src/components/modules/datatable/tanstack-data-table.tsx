"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Updater,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  analyzeAllColumnsData,
  getInitialColumnVisibility,
} from "./tanstack-table-helpers";
import {
  DataTableProps,
  EMPTY_ARRAY,
  DEFAULT_PAGE_SIZE_OPTIONS,
  isMatch,
  TableDensity,
  DataTableFilterField,
} from "./tanstack-data-table.types";
import {
  TanstackDataTableToolbar,
  TanstackDataTableActiveFilters,
} from "./tanstack-data-table-toolbar";
import { TanstackDataTableBulkActionsBar } from "./tanstack-data-table-bulk-actions";
import { TanstackDataTableGrid } from "./tanstack-data-table-grid";
import { TanstackDataTablePagination } from "./tanstack-data-table-pagination";

export type {
  TableDensity,
  DataTableFilterOption,
  DataTableFilterField,
  DataTableBulkAction,
  DataTableProps,
} from "./tanstack-data-table.types";

// ---------------------------------------------------------------------------
// Main TanstackDataTable Component
// ---------------------------------------------------------------------------
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

  // Stable signature representing the *actual* set of columns (id/accessorKey/header).
  // Callers (e.g. GenericDataTable) often build `columns` dynamically from data keys,
  // so the array reference changes whenever columns are added/removed. We derive a
  // cheap string key from that shape so memo/effect deps below only re-run when the
  // columns *actually* change, instead of depending on unstable data-only deps.
  const columnsSignature = React.useMemo(
    () => {
      const sig = columns
        .map((c) => {
          const anyCol = c as unknown as { id?: string; accessorKey?: string; header?: unknown; enableHiding?: boolean };
          return (
            anyCol.id ||
            anyCol.accessorKey ||
            (typeof anyCol.header === "string" ? anyCol.header : "")
          );
        })
        .join("|");
      return sig;
    },
    [columns]
  );

  // Analyze dataset column presence — re-runs when data OR the set of columns changes.
  const dataAnalysis = React.useMemo(() => {
    return analyzeAllColumnsData(data, columns);
  }, [data, columns]);

  // Track whether we've done the initial visibility evaluation
  const hasEvaluatedVisibility = React.useRef(false);
  const evaluatedSignatureRef = React.useRef<string | null>(null);
  const lastColumnsLengthRef = React.useRef(columns.length);

  // Initial column visibility state — runs once synchronously on first render
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    if (hideEmptyColumnsInitially && data.length > 0 && columns.length > 0) {
      hasEvaluatedVisibility.current = true;
      evaluatedSignatureRef.current = columnsSignature;
      return getInitialColumnVisibility(data, columns, true);
    }
    return {};
  });

  // IMPORTANT: When columns transition from empty to populated, we must ensure
  // columnVisibility is reset so the table renders with all columns visible.
  // This uses useMemo to synchronously compute the visibility BEFORE useReactTable is called.
  const effectiveColumnVisibility = React.useMemo(() => {
    const columnsJustPopulated = 
      lastColumnsLengthRef.current === 0 && columns.length > 0;
    
    if (columnsJustPopulated) {
      console.log("✨ [TanstackDataTable] Columns populated! Ensuring all columns visible");
      lastColumnsLengthRef.current = columns.length;
      return {};
    }
    
    lastColumnsLengthRef.current = columns.length;
    return columnVisibility;
  }, [columnVisibility, columns.length]);

  // Update the actual columnVisibility state if it diverged from effectiveColumnVisibility
  React.useEffect(() => {
    if (effectiveColumnVisibility !== columnVisibility && Object.keys(effectiveColumnVisibility).length === 0) {
      console.log("�️ [TanstackDataTable] Syncing columnVisibility to effectiveColumnVisibility");
      setColumnVisibility(effectiveColumnVisibility);
    }
  }, [effectiveColumnVisibility, columnVisibility]);

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
      columnVisibility: effectiveColumnVisibility,
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

  const handleFilterValueChange = (field: string, val: string) => {
    setFilterValues((prev) => ({ ...prev, [field]: val }));
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
          <TanstackDataTableToolbar
            table={table}
            dataAnalysis={dataAnalysis}
            searchKeys={stableSearchKeys}
            filters={stableFilters}
            searchValue={searchValue}
            onSearchValueChange={setSearchValue}
            filterValues={filterValues}
            onFilterValueChange={handleFilterValueChange}
            showColumnVisibility={showColumnVisibility}
            showDensitySelector={showDensitySelector}
            density={density}
            onDensityChange={setDensity}
          />

          {activeFiltersCount > 0 && (
            <TanstackDataTableActiveFilters
              searchValue={searchValue}
              onSearchValueChange={setSearchValue}
              filters={stableFilters}
              filterValues={filterValues}
              onFilterValueChange={handleFilterValueChange}
              onResetFilters={handleResetFilters}
            />
          )}

          {selectedRows.size > 0 && bulkActions && (
            <TanstackDataTableBulkActionsBar
              selectedCount={selectedRows.size}
              bulkActions={bulkActions}
              isDeleting={isDeleting}
              isExporting={isExporting}
              onExport={handleBulkExport}
              onRequestDelete={() => setShowDeleteConfirm(true)}
            />
          )}
        </div>

        {/* Table Grid */}
        <TanstackDataTableGrid
          table={table}
          isLoading={isLoading}
          density={density}
          stickyHeader={stickyHeader}
          enableZebraStripes={enableZebraStripes}
          bulkActions={bulkActions}
          renderRowActions={renderRowActions}
          onRowClick={onRowClick}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          noDataText={noDataText}
          activeFiltersCount={activeFiltersCount}
          onResetFilters={handleResetFilters}
        />

        {/* Pagination Section */}
        {!isLoading && filteredData.length > 0 && (
          <TanstackDataTablePagination
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
