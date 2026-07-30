"use client";

import { useEffect, useState } from "react";
import { getSettlements, triggerSettlement, retrySettlement } from "@/services/settlement.service";
import type { SettlementRecord } from "@/types/settlement.types";

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for IT trigger
  const [contractNumber, setContractNumber] = useState("");
  const [scripId, setScripId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    const res = await getSettlements();
    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      setSettlements(res.data.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNumber) return;

    setTriggering(true);
    setMessage(null);
    setError(null);

    const res = await triggerSettlement({
      contractNumber,
      scripId: scripId || undefined,
      quantity: quantity ? Number(quantity) : undefined,
      price: price ? Number(price) : undefined,
      processType: "N",
    });

    if (res.error) {
      setError(res.error.message);
    } else {
      setMessage(`Settlement triggered for contract #${contractNumber}`);
      setContractNumber("");
      setScripId("");
      setQuantity("");
      setPrice("");
      fetchList();
    }
    setTriggering(false);
  };

  const handleRetry = async (cn: string) => {
    const res = await retrySettlement(cn);
    if (res.error) {
      alert(`Retry failed: ${res.error.message}`);
    } else {
      alert(`Retry enqueued for ${cn}`);
      fetchList();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settlement Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          IT & Admin Settlement Execution Engine (CNS Database)
        </p>
      </div>

      {/* Trigger Form */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Trigger New Settlement (IT Role)
        </h2>
        {message && <div className="mb-4 p-3 rounded bg-emerald-50 text-emerald-700 text-sm">{message}</div>}
        {error && <div className="mb-4 p-3 rounded bg-rose-50 text-rose-700 text-sm">{error}</div>}

        <form onSubmit={handleTrigger} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contract Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 100293"
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Scrip ID
            </label>
            <input
              type="text"
              placeholder="e.g. 18012"
              value={scripId}
              onChange={(e) => setScripId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Price
            </label>
            <input
              type="number"
              step="0.0001"
              placeholder="e.g. 3040.0000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={triggering}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {triggering ? "Triggering..." : "Execute Settlement"}
            </button>
          </div>
        </form>
      </div>

      {/* List Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Settlement Records</h2>
          <button
            onClick={fetchList}
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
                  <tr key={row.ContractNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
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
                      <button
                        onClick={() => handleRetry(row.ContractNumber)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Retry Job
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
