"use client";

import * as React from "react";
import {
  Cell,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  Header,
  HeaderGroup,
  Row,
  Updater,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export type DataTableFilterOption = {
  label: string;
  value: string;
};

export type DataTableFilterField<T> = {
  field: keyof T & string;
  label: string;
  options: DataTableFilterOption[];
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

  const table = useReactTable({
    data: filteredData,
    columns,
    pageCount: Math.ceil(filteredData.length / pageSize),
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
      onPaginationChange: (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
      setPageSize(next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
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

      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <div>
            {filteredData.length} record{filteredData.length === 1 ? "" : "s"} found
          </div>
          <div className="flex items-center gap-2">
            <span>Rows</span>
            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-20">
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

        <div className="mt-5 overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup: HeaderGroup<T>) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header: Header<T, unknown>) => (
                    <TableHead key={header.id} className="text-left">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                  {renderRowActions ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {visibleRows.length ? (
                visibleRows.map((row: Row<T>, idx: number) => (
                  <TableRow key={row.id} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                    {row.getVisibleCells().map((cell: Cell<T, unknown>) => (
                      <TableCell key={cell.id} className="text-left align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                    {renderRowActions ? <TableCell className="text-right">{renderRowActions(row.original)}</TableCell> : null}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + (renderRowActions ? 1 : 0)} className="py-10 text-center text-muted-foreground">
                    {noDataText}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

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
      </CardContent>
    </Card>
  );
}
