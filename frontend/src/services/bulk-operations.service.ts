/**
 * Bulk operations API client
 * Handles bulk delete, export, and other batch operations
 */

import { apiFetch } from "@/lib/api-client";

/**
 * Bulk delete settlements
 */
export async function bulkDeleteSettlements(contractNumbers: string[]): Promise<void> {
  const result = await apiFetch("/settlements/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ contractNumbers }),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}

/**
 * Export settlements to CSV
 */
export async function exportSettlements(contractNumbers?: string[]): Promise<Blob> {
  const params = new URLSearchParams();
  if (contractNumbers && contractNumbers.length > 0) {
    params.append("ids", contractNumbers.join(","));
  }

  const response = await fetch(
    `/api/v1/settlements/export?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to export settlements");
  }

  return await response.blob();
}

/**
 * Bulk delete reports
 */
export async function bulkDeleteReports(jobIds: string[]): Promise<void> {
  const result = await apiFetch("/reports/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ jobIds }),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}

/**
 * Export reports to CSV
 */
export async function exportReports(jobIds?: string[]): Promise<Blob> {
  const params = new URLSearchParams();
  if (jobIds && jobIds.length > 0) {
    params.append("ids", jobIds.join(","));
  }

  const response = await fetch(
    `/api/v1/reports/export?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to export reports");
  }

  return await response.blob();
}
