"use client";

import type { SettlementRecord } from "@/types/settlement.types";

export type SettlementTableProps = {
  settlements: SettlementRecord[];
  loading?: boolean;
  onRetry?: (contractNumber: string) => void;
  onRefresh?: () => void;
};

export function SettlementTable({
  settlements,
  loading,
  onRetry,
  onRefresh,
}: SettlementTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Settlement Records
        </h2>
        <button
          onClick={onRefresh}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-4">Loading settlements...</p>
      ) : settlements.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No settlement records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Contract #</th>
                <th className="px-4 py-3">Scrip ID</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Trade Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {settlements.map((row) => (
                <tr
                  key={row.ContractNumber}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {row.ContractNumber}
                  </td>
                  <td className="px-4 py-3">{row.ScripID || "-"}</td>
                  <td className="px-4 py-3">{row.Quantity ?? "-"}</td>
                  <td className="px-4 py-3">{row.Price ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.ProcessType === "Y"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {row.ProcessType === "Y" ? "SETTLED" : "PENDING"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.TradeDate ? new Date(row.TradeDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {onRetry && (
                      <button
                        onClick={() => onRetry(row.ContractNumber)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Retry Job
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
