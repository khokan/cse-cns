"use client";

import type { Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DataTableViewOptionsProps<TData>
  extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>;
  disabled?: boolean;
}

export function DataTableViewOptions<TData>({
  table,
  disabled,
  className,
  ...props
}: DataTableViewOptionsProps<TData>) {
  const columns = React.useMemo(
    () => {
      const allCols = table.getAllColumns();
      // Filter columns that can be hidden - they need enableHiding: true
      // We also check for accessorFn OR accessorKey (which auto-generates accessorFn)
      return allCols.filter(
        (column) => column.getCanHide()
      );
    },
    [table],
  );

  // Debug logging
  React.useEffect(() => {
    const allColumns = table.getAllColumns();
    console.log("🔍 DataTableViewOptions Debug:");
    console.log("📊 Total columns:", allColumns.length);
    console.log("📋 All columns:", allColumns.map(col => ({
      id: col.id,
      hasAccessorFn: typeof col.accessorFn !== "undefined",
      canHide: col.getCanHide(),
      label: col.columnDef.meta?.label ?? col.id,
    })));
    console.log("✅ Filterable columns (getCanHide()):", columns.length);
    console.log("📍 Filtered columns:", columns.map(col => ({
      id: col.id,
      label: col.columnDef.meta?.label ?? col.id,
    })));
  }, [table, columns]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="combobox"
          variant="outline"
          className="ml-auto hidden h-8 font-normal lg:flex"
          disabled={disabled}
        >
          <Settings2 className="text-muted-foreground" />
          View
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-44 p-0", className)} {...props}>
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem
                  key={column.id}
                  data-checked={column.getIsVisible()}
                  onSelect={() =>
                    column.toggleVisibility(!column.getIsVisible())
                  }
                >
                  <span className="truncate">
                    {column.columnDef.meta?.label ?? column.id}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
