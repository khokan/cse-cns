"use client";

import { useState } from "react";
import { getSettlements, retrySettlement } from "@/services/settlement.service";
import { CreateSettlementForm } from "@/components/modules/settlement/CreateSettlementForm";
import { SettlementTable } from "@/components/modules/settlement/SettlementTable";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useJobStatus } from "@/hooks/useJobStatus";
import { toast } from "sonner";
import type { SettlementRecord } from "@/types/settlement.types";

export default function SettlementsPage() {
  const queryClient = useQueryClient();
  const [userId] = useState<string | undefined>();

  const { data: settlements = [], isLoading } = useQuery<SettlementRecord[]>({
    queryKey: ["settlements"],
    queryFn: async () => {
      const res = await getSettlements();
      if (res.error) throw new Error(res.error.message);
      return res.data?.data ?? [];
    },
  });

  useJobStatus(userId, undefined, (event) => {
    toast.info(`Settlement ${event.status}`, {
      description: event.contractNumber
        ? `Contract #${event.contractNumber}`
        : undefined,
    });
    queryClient.invalidateQueries({ queryKey: ["settlements"] });
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["settlements"] });
  };

  const handleRetry = async (cn: string) => {
    const res = await retrySettlement(cn);
    if (res.error) {
      alert(`Retry failed: ${res.error.message}`);
    } else {
      alert(`Retry enqueued for ${cn}`);
      handleSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Settlement Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          IT & Admin Settlement Execution Engine (CNS Database)
        </p>
      </div>

      <CreateSettlementForm onSuccess={handleSuccess} />
      <SettlementTable
        settlements={settlements}
        loading={isLoading}
        onRefresh={handleSuccess}
        onRetry={handleRetry}
      />
    </div>
  );
}
