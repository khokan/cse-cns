"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2 } from "lucide-react";
import { DataTableBulkAction } from "./tanstack-data-table.types";

// ---------------------------------------------------------------------------
// Bulk Actions Toolbar — shown when at least one row is selected.
// ---------------------------------------------------------------------------
export function TanstackDataTableBulkActionsBar<T extends object>({
  selectedCount,
  bulkActions,
  isDeleting,
  isExporting,
  onExport,
  onRequestDelete,
}: {
  selectedCount: number;
  bulkActions: DataTableBulkAction<T>;
  isDeleting: boolean;
  isExporting: boolean;
  onExport: () => void;
  onRequestDelete: () => void;
}) {
  return (
    <div className="bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/30 rounded-lg px-3 py-2 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-2">
        <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-medium text-[11px]">
          {selectedCount} selected
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
            onClick={onExport}
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
            onClick={onRequestDelete}
            disabled={isDeleting}
            className="gap-1 h-7 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}
