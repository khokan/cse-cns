import { Database } from "lucide-react";
import Link from "next/link";
import { userService } from "@/services/user.service";
import { getAccessibleTables } from "@/services/datatable.service";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Data Tables | CSE-CNS",
  description: "Browse and manage registered CNS and CNSWeb tables.",
};

export const dynamic = "force-dynamic";

export default async function DataTablesPage() {
  const session = await userService.getSession();
  if (!session?.data) redirect("/login");

  const tablesRes = await getAccessibleTables();
  const tables = tablesRes.data?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Tables</h1>
        <p className="text-sm text-muted-foreground">
          Select a registered table to view, create, update or delete records.
        </p>
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">No accessible tables found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <Link key={table.key} href={`/data/${table.key}`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-sm transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base capitalize">{table.model}</CardTitle>
                  </div>
                  <CardDescription className="text-xs uppercase tracking-wide">
                    {table.db} • {table.canWrite ? "Read / Write" : "Read Only"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Primary key: <span className="font-medium text-foreground">{table.primaryKey}</span>
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
