"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

export interface JobStatusEvent {
  jobId?: string;
  contractNumber?: string;
  status: string;
  filePath?: string;
  fileName?: string;
  errorMessage?: string;
}

export function useJobStatus(
  userId: string | undefined,
  onReportUpdate?: (event: JobStatusEvent) => void,
  onSettlementUpdate?: (event: JobStatusEvent) => void
) {
  useEffect(() => {
    if (!userId) return;

    const socket = getSocket(userId);

    const handleReportStatus = (data: JobStatusEvent) => {
      console.log("⚡ [useJobStatus] Received report status update:", data);
      if (onReportUpdate) onReportUpdate(data);
    };

    const handleSettlementStatus = (data: JobStatusEvent) => {
      console.log("⚡ [useJobStatus] Received settlement status update:", data);
      if (onSettlementUpdate) onSettlementUpdate(data);
    };

    socket.on("report:status", handleReportStatus);
    socket.on("settlement:status", handleSettlementStatus);

    return () => {
      socket.off("report:status", handleReportStatus);
      socket.off("settlement:status", handleSettlementStatus);
    };
  }, [userId, onReportUpdate, onSettlementUpdate]);
}
