"use client";

import { Coins, Landmark, Layers, Wallet, Banknote } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReceivableSummary } from "@/types/reconciliation.types";
import { KpiCard } from "./KpiCard";
import { formatBDT } from "./format";

// ---------------------------------------------------------------------------
// Group Distribution — interactive donut chart (recharts)
// ---------------------------------------------------------------------------
const GROUP_COLORS: Record<string, string> = {
  "A B G N": "#6366f1",
  Z: "#f59e0b",
  Spot: "#10b981",
};

function GroupDistributionChart({
  spot,
  abgn,
  z,
}: {
  spot: number;
  abgn: number;
  z: number;
}) {
  const chartData = [
    { name: "A B G N", value: abgn },
    { name: "Z", value: z },
    { name: "Spot", value: spot },
  ];
  const total = spot + abgn + z || 1;

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={GROUP_COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              formatBDT(Number(value)),
              String(name),
            ]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-4 text-xs mt-2">
        {chartData.map((seg) => (
          <div key={seg.name} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: GROUP_COLORS[seg.name] }}
            />
            <span className="text-muted-foreground">{seg.name}</span>
            <span className="font-semibold">
              {((seg.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Receivable Section — KPI cards + group distribution donut
// ---------------------------------------------------------------------------
export function ReceivableSection({
  receivable,
  cseCommissionTotal,
  aitTotal,
}: {
  receivable: ReceivableSummary;
  cseCommissionTotal: number;
  aitTotal: number;
}) {
  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Spot" value={receivable.spot} icon={Wallet} accent="text-emerald-500 bg-emerald-500" />
        <KpiCard label="A B G N" value={receivable.abgn} icon={Layers} accent="text-primary bg-primary" />
        <KpiCard label="Z" value={receivable.z} icon={Coins} accent="text-amber-500 bg-amber-500" />
        <KpiCard label="Total Value" value={receivable.totalValue} icon={Landmark} accent="text-indigo-500 bg-indigo-500" sublabel="Receivable against trade date" />
        <KpiCard label="CSE Commission" value={cseCommissionTotal} icon={Banknote} accent="text-cyan-500 bg-cyan-500" />
        <KpiCard label="AIT" value={aitTotal} icon={Coins} accent="text-rose-500 bg-rose-500" />
      </div>

      {/* Group Distribution Chart */}
      <Card className="bg-card/60 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Group Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GroupDistributionChart
            spot={receivable.spot}
            abgn={receivable.abgn}
            z={receivable.z}
          />
        </CardContent>
      </Card>
    </div>
  );
}
