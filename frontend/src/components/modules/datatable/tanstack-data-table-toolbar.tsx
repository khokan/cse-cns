"use client";

import * as React from "react";
import { useReactTable } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, X, SlidersHorizontal, RotateCcw, AlignJustify } from "lucide-react";
import { TanstackDataTableViewOptions } from "./tanstack-data-table-view-options";
import { ColumnDataPresence } from "./tanstack-table-helpers";
import { DataTableFilterField, TableDensity } from "./tanstack-data-table.types";

// ---------------------------------------------------------------------------
// Toolbar: search input + dynamic filter dropdowns + column visibility +
// density selector.
// ---------------------------------------------------------------------------
export function TanstackDataTableToolbar<T extends object>({
  table,
  dataAnalysis,
  searchKeys,
  filters,
  searchValue,
  onSearchValueChange,
  filterValues,
  onFilterValueChange,
  showColumnVisibility,
  showDensitySelector,
  density,
  onDensityChange,
}: {
  table: ReturnType<typeof useReactTable<T>>;
  dataAnalysis: Record<string, ColumnDataPresence>;
  searchKeys: (keyof T & string)[];
  filters: DataTableFilterField<T>[];
  searchValue: string;
  onSearchValueChange: (val: string) => void;
  filterValues: Record<string, string>;
  onFilterValueChange: (field: string, val: string) => void;
  showColumnVisibility: boolean;
  showDensitySelector: boolean;
  density: TableDensity;
  onDensityChange: (density: TableDensity) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {/* Search input */}
        {searchKeys.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchValueChange(e.target.value)}
              placeholder="Search records..."
              className="pl-8 pr-8 h-8 text-xs border-border/80 shadow-xs"
            />
            {searchValue && (
              <button
                onClick={() => onSearchValueChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Filter Dropdowns */}
        {filters.map((filter) => (
          <Select
            key={filter.field}
            value={filterValues[filter.field] ?? "all"}
            onValueChange={(val) => onFilterValueChange(filter.field, val)}
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
          <TanstackDataTableViewOptions table={table} dataAnalysis={dataAnalysis} />
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
                onClick={() => onDensityChange("compact")}
                className="text-xs justify-between cursor-pointer"
              >
                Compact {density === "compact" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDensityChange("comfortable")}
                className="text-xs justify-between cursor-pointer"
              >
                Comfortable {density === "comfortable" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDensityChange("spacious")}
                className="text-xs justify-between cursor-pointer"
              >
                Spacious {density === "spacious" && "✓"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active Filter Chips / Badges
// ---------------------------------------------------------------------------
export function TanstackDataTableActiveFilters<T extends object>({
  searchValue,
  onSearchValueChange,
  filters,
  filterValues,
  onFilterValueChange,
  onResetFilters,
}: {
  searchValue: string;
  onSearchValueChange: (val: string) => void;
  filters: DataTableFilterField<T>[];
  filterValues: Record<string, string>;
  onFilterValueChange: (field: string, val: string) => void;
  onResetFilters: () => void;
}) {
  return (
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
            <button onClick={() => onSearchValueChange("")} className="hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {filters.map((filter) => {
          const val = filterValues[filter.field];
          if (!val || val === "all") return null;
          const label = filter.options.find((o) => o.value === val)?.label || val;
          return (
            <Badge
              key={filter.field}
              variant="secondary"
              className="h-5 gap-1 text-[11px] font-normal bg-background border border-border/60"
            >
              {filter.label}: {label}
              <button
                onClick={() => onFilterValueChange(filter.field, "all")}
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
        onClick={onResetFilters}
        className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
      >
        <RotateCcw className="h-3 w-3" /> Clear all
      </Button>
    </div>
  );
}
