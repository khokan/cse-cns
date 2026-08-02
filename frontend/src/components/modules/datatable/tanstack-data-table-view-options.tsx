"use client";

import * as React from "react";
import { useReactTable } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns3 } from "lucide-react";
import { getColumnLabel, ColumnDataPresence } from "./tanstack-table-helpers";

// ---------------------------------------------------------------------------
// DataTableViewOptions (Column Visibility Menu with Data Presence Badges)
// ---------------------------------------------------------------------------
export function TanstackDataTableViewOptions<T extends object>({
  table,
  dataAnalysis,
}: {
  table: ReturnType<typeof useReactTable<T>>;
  dataAnalysis: Record<string, ColumnDataPresence>;
}) {
  const [columnSearch, setColumnSearch] = React.useState("");

  const hideableColumns = React.useMemo(() => {
    const allColumns = table.getAllColumns();
    console.log("🔍 [ViewOptions] All columns:", allColumns.map(c => {
      const colDef = c.columnDef as unknown as Record<string, unknown>;
      return { id: c.id, canHide: c.getCanHide(), enableHiding: colDef.enableHiding };
    }));
    const hideable = allColumns.filter((column) => column.getCanHide());
    console.log("🎯 [ViewOptions] Hideable columns:", hideable.length, hideable.map(c => c.id));
    return hideable;
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
