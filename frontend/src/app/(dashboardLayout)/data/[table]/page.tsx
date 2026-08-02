"use client";

import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { GenericDataTable } from "@/components/modules/datatable/GenericDataTable";
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
// data is not yet loaded, which would cause GenericDataTable's useEffect to
// re-run unnecessarily.
const EMPTY_ROWS: Record<string, unknown>[] = [];

export default function DataTableDetailPage() {
  const params = useParams();
  const table = String(params.table ?? "");

  // Server-side pagination state. The backend already supports page/limit
  // params (see datatable.service.ts), but this page was previously calling
  // the hook with no params at all, so it always fetched only the first
  // page (default limit=10) — for large tables like taxToNBR (1000+ rows)
  // the in-table "pagination" was just re-slicing that same first page.
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, refetch } = useDatatableRows(table, {
    page: pageIndex + 1,
    limit: pageSize,
  });
  const createMutation = useCreateRow(table);
  const updateMutation = useUpdateRow(table);
  const deleteMutation = useDeleteRow(table);

  const rows = (data?.data as Record<string, unknown>[] | undefined) ?? EMPTY_ROWS;
  const primaryKey = data?.meta?.primaryKey ?? "id";
  const canWrite = data?.meta?.canWrite ?? false;
  const totalRecords = data?.meta?.total ?? 0;

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
  const handlePageChange = useCallback((newPageIndex: number) => {
    setPageIndex(newPageIndex);
  }, []);
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  }, []);

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

      <GenericDataTable
        table={table}
        rows={rows}
        primaryKey={primaryKey}
        canWrite={canWrite}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isSubmitting={
          createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
        }
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
