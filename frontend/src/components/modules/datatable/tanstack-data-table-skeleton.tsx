"use client";

import * as React from "react";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TableDensity, DENSITY_STYLES } from "./tanstack-data-table.types";

// ---------------------------------------------------------------------------
// Skeleton Table Loader
// ---------------------------------------------------------------------------
export function TanstackDataTableSkeleton({
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
