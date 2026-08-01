import { useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook for managing bulk table operations (delete, export)
 * Handles selection state, confirmation dialogs, and API calls
 */
export function useBulkActions<T extends { id?: string; [key: string]: unknown }>(
  onBulkDelete?: (ids: string[]) => Promise<void>,
  onBulkExport?: (ids?: string[]) => Promise<Blob>,
  allItems?: T[]
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSelectAll = useCallback(
    (checked: boolean, items: T[]) => {
      if (checked) {
        const ids = items.map((item) => item.id || "").filter(Boolean);
        setSelectedIds(new Set(ids));
      } else {
        setSelectedIds(new Set());
      }
    },
    []
  );

  const handleSelectItem = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0 || !onBulkDelete) return;

    setIsDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await onBulkDelete(ids);
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      toast.success(`Successfully deleted ${ids.length} item(s)`);
      return true;
    } catch (error) {
      toast.error("Failed to delete items", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, onBulkDelete]);

  const handleBulkExport = useCallback(async () => {
    if (!onBulkExport) return;

    setIsExporting(true);
    try {
      const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
      const blob = await onBulkExport(ids);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `export-${new Date().getTime()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export successful. Download started.");
      return true;
    } catch (error) {
      toast.error("Failed to export items", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    } finally {
      setIsExporting(false);
    }
  }, [selectedIds, onBulkExport]);

  const isAllSelected =
    (allItems?.length ?? 0) > 0 && selectedIds.size === (allItems?.length ?? 0);
  const isPartialSelected = selectedIds.size > 0 && selectedIds.size < (allItems?.length ?? 0);

  return {
    selectedIds,
    isDeleting,
    isExporting,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleSelectAll,
    handleSelectItem,
    handleBulkDelete,
    handleBulkExport,
    isAllSelected,
    isPartialSelected,
  };
}
