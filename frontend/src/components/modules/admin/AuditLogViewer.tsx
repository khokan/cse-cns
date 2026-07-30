"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/services/admin.service";
import { TanstackDataTable } from "@/components/modules/common/tanstack-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AuditLogItem } from "@/types/admin.types";

const columns: ColumnDef<AuditLogItem>[] = [
  {
    accessorKey: "createdAt",
    header: "Timestamp",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
  },
  { accessorKey: "action", header: "Action" },
  { accessorKey: "entity", header: "Entity" },
  { accessorKey: "userEmail", header: "User" },
  {
    accessorKey: "entityId",
    header: "Entity ID",
    cell: ({ getValue }) => (getValue() as string) ?? "—",
  },
];

export function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "audit-logs", page, search],
    queryFn: async () => {
      const res = await getAuditLogs({ page, limit, search });
      if (res.error) throw new Error(res.error.message);
      return res.data!;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Search action, entity, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={() => refetch()}>
            Search
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {data?.meta.total ?? 0} total entries
        </p>
      </div>

      <TanstackDataTable
        columns={columns}
        data={data?.data ?? []}
        searchKeys={["action", "entity", "userEmail"]}
        noDataText={isLoading ? "Loading audit logs..." : "No audit logs found."}
      />

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {data?.meta.totalPages ?? 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!data || page >= data.meta.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
