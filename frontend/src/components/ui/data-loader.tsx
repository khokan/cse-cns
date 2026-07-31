"use client";

import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataLoaderProps {
  isLoading: boolean;
  isEmpty: boolean;
  error?: Error | null;
  children: ReactNode;
  skeletonCount?: number;
  skeletonHeight?: string;
  onRetry?: () => void;
}

/**
 * Wraps async data display with loading, empty, and error states
 * 
 * Usage:
 * const { data, isLoading, error } = useQuery({ ... });
 * 
 * <DataLoader
 *   isLoading={isLoading}
 *   isEmpty={!data?.length}
 *   error={error}
 *   onRetry={() => refetch()}
 * >
 *   <DataTable data={data} />
 * </DataLoader>
 */
export function DataLoader({
  isLoading,
  isEmpty,
  error,
  children,
  skeletonCount = 5,
  skeletonHeight = "h-12",
  onRetry,
}: DataLoaderProps) {
  // Loading state - show skeleton loaders
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading data">
        <div className="sr-only">Loading content...</div>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className={`w-full ${skeletonHeight}`} />
        ))}
      </div>
    );
  }

  // Error state - show error message with retry
  if (error) {
    return (
      <div
        className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-2">
              Error Loading Data
            </h3>
            <p className="text-red-800 text-sm mb-4">
              {error.message || "An error occurred while loading data."}
            </p>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="text-red-700 border-red-200 hover:bg-red-100"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty state - show empty placeholder
  if (isEmpty) {
    return <EmptyState />;
  }

  // Show content
  return children;
}
