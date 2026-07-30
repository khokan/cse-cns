"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/services/admin.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileBarChart, CheckCircle2, ArrowLeftRight } from "lucide-react";

export function AdminStatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await getDashboardStats();
      if (res.error) throw new Error(res.error.message);
      return res.data?.data ?? null;
    },
  });

  const items = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: "Registered accounts",
    },
    {
      label: "Active Users",
      value: stats?.activeUsers ?? 0,
      icon: CheckCircle2,
      description: "Currently active",
    },
    {
      label: "Report Jobs",
      value: stats?.totalReportJobs ?? 0,
      icon: FileBarChart,
      description: "Jobs submitted",
    },
    {
      label: "Settlements",
      value: stats?.totalSettlements ?? 0,
      icon: ArrowLeftRight,
      description: "Total records",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "—" : item.value.toLocaleString()}
            </div>
            <CardDescription>{item.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
