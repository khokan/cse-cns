"use client";

import { useState } from "react";
import { triggerSettlement } from "@/services/settlement.service";
import type { CreateSettlementPayload } from "@/types/settlement.types";

export type CreateSettlementFormProps = {
  onSuccess?: () => void;
};

export function CreateSettlementForm({ onSuccess }: CreateSettlementFormProps) {
  const [contractNumber, setContractNumber] = useState("");
  const [scripId, setScripId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNumber) return;

    setTriggering(true);
    setMessage(null);
    setError(null);

    const payload: CreateSettlementPayload = {
      contractNumber,
      scripId: scripId || undefined,
      quantity: quantity ? Number(quantity) : undefined,
      price: price ? Number(price) : undefined,
      processType: "N",
    };

    const res = await triggerSettlement(payload);

    if (res.error) {
      setError(res.error.message);
    } else {
      setMessage(`Settlement triggered for contract #${contractNumber}`);
      setContractNumber("");
      setScripId("");
      setQuantity("");
      setPrice("");
      onSuccess?.();
    }
    setTriggering(false);
  };

  return (
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
  );
}
