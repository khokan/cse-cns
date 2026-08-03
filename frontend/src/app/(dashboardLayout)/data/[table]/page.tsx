"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { DataTableGeneric } from "@/components/modules/common/data-table-generic";
import { getSortingStateParser } from "@/lib/parsers";
import {
  useDatatableRows,
  useCreateRow,
  useUpdateRow,
  useDeleteRow,
} from "@/hooks/useDatatable";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Stable empty array — avoids creating a new reference on every render when
// data is not yet loaded, which would cause the table's useEffect to
// re-run unnecessarily.
const EMPTY_ROWS: Record<string, unknown>[] = [];

// Query keys owned/written by `useDataTable` (inside `DataTableGeneric`)
// that should NOT be forwarded as per-column `where` filters to the backend.
const RESERVED_QUERY_KEYS = new Set([
  "page",
  "perPage",
  "sort",
  "filters",
  "joinOperator",
]);

export default function DataTableDetailPage() {
  const params = useParams();
  const table = String(params.table ?? "");
  const searchParams = useSearchParams();

  // Page/perPage/sort/per-column filters all live in the URL under the same
  // keys `useDataTable` uses internally. We only read them here to build the
  // server fetch params; the table UI owns writing to these query params
  // when the user paginates/sorts/filters, so the two stay in sync (and the
  // view is bookmarkable/shareable).
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [sorting] = useQueryState(
    "sort",
    getSortingStateParser().withDefault([])
  );

  // Translate generic-table sort/filter URL state into the backend's
  // `sortBy` / `sortOrder` / dynamic per-field query params (see
  // datatable.service.ts: any non-reserved key becomes an exact-match
  // `where` filter, and `search` triggers the configured full-text search).
  const queryParams = useMemo(() => {
    const extra: Record<string, unknown> = {};

    const [firstSort] = sorting;
    if (firstSort) {
      extra.sortBy = firstSort.id;
      extra.sortOrder = firstSort.desc ? "desc" : "asc";
    }

    // Each per-column text filter (from DataTableToolbar) is stored under
    // its own query key (the column id), so just forward any non-reserved
    // param straight through as a dynamic filter.
    searchParams.forEach((value, key) => {
      if (!RESERVED_QUERY_KEYS.has(key) && value !== "") {
        extra[key] = value;
      }
    });

    return {
      page,
      limit: perPage,
      ...extra,
    };
  }, [page, perPage, sorting, searchParams]);

  const { data, isLoading, refetch } = useDatatableRows(table, queryParams);
  const createMutation = useCreateRow(table);
  const updateMutation = useUpdateRow(table);
  const deleteMutation = useDeleteRow(table);

  const rows = (data?.data as Record<string, unknown>[] | undefined) ?? EMPTY_ROWS;
  const primaryKey = data?.meta?.primaryKey ?? "id";
  const canWrite = data?.meta?.canWrite ?? false;
  const totalPages = data?.meta?.totalPages ?? 1;


  const handleRefresh = useCallback(() => refetch(), [refetch]);
  const handleCreate = useCallback(
    (payload: Record<string, unknown>) => createMutation.mutate(payload),
    [createMutation]
  );
  const handleUpdate = useCallback(
    (id: string, payload: Record<string, unknown>) =>
      updateMutation.mutate({ id, payload }),
    [updateMutation]
  );
  const handleDelete = useCallback(
    (id: string) => deleteMutation.mutate(id),
    [deleteMutation]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href="/data">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">{table}</h1>
          <p className="text-sm text-muted-foreground">
            Generic CRUD for the <code>{table}</code> table.
          </p>
        </div>
      </div>

      <DataTableGeneric
        table={table}
        rows={rows}
        primaryKey={primaryKey}
        canWrite={canWrite}
        isLoading={isLoading}
        pageCount={totalPages}
        onRefresh={handleRefresh}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isSubmitting={
          createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
        }
      />
    </div>
  );
}
