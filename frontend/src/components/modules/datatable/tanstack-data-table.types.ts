import { ColumnDef } from "@tanstack/react-table";

// ---------------------------------------------------------------------------
// Shared Types & Constants for TanstackDataTable
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

export const DENSITY_STYLES: Record<
  TableDensity,
  { cell: string; header: string; action: string }
> = {
  compact: {
    cell: "py-1 px-2.5 text-xs leading-snug",
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

export function isMatch(value: unknown, query: string) {
  if (value === undefined || value === null) return false;
  return String(value).toLowerCase().includes(query);
}

// Stable empty defaults — defined outside the component so their reference
// never changes between renders (avoids triggering useMemo/useEffect).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EMPTY_ARRAY: any[] = [];
export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
