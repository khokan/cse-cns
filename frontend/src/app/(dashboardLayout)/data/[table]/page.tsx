"use client";

import { useParams } from "next/navigation";
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

export default function DataTableDetailPage() {
  const params = useParams();
  const table = String(params.table ?? "");

  const { data, isLoading, refetch } = useDatatableRows(table);
  const createMutation = useCreateRow(table);
  const updateMutation = useUpdateRow(table);
  const deleteMutation = useDeleteRow(table);

  const handleUpdate = (id: string, payload: Record<string, unknown>) => {
    updateMutation.mutate({ id, payload });
  };

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
        rows={(data?.data ?? []) as Record<string, unknown>[]}
        primaryKey={data?.meta.primaryKey ?? "id"}
        canWrite={data?.meta.canWrite ?? false}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onCreate={(payload) => createMutation.mutate(payload)}
        onUpdate={handleUpdate}
        onDelete={(id) => deleteMutation.mutate(id)}
        isSubmitting={
          createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
        }
      />
    </div>
  );
}
