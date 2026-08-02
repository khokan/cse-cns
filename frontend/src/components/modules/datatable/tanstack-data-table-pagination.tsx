"use client";

import * as React from "react";
import { useReactTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// DataTablePagination Component
// ---------------------------------------------------------------------------
export function TanstackDataTablePagination<T extends object>({
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
