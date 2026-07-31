# Frontend UI Components - Implementation Examples

Complete code examples for missing UI components in the codebase.

---

## 1. ERROR BOUNDARY COMPONENT

**File:** `src/components/shared/error-boundary.tsx`

```typescript
"use client";

import React, { ReactNode, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component to catch React component errors
 * 
 * Usage:
 * <ErrorBoundary componentName="my-component">
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: this.props.componentName || "unknown",
        boundary: "component",
      },
    });

    // Call optional error handler
    this.props.onError?.(error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto my-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  Component Error
                </h3>
                <p className="text-red-800 text-sm mb-4">
                  An error occurred while rendering this component. 
                  {this.props.componentName && ` (${this.props.componentName})`}
                </p>
                {this.state.error && (
                  <pre className="text-xs bg-red-100 p-2 rounded mb-4 overflow-auto max-h-32 text-red-700">
                    {this.state.error.message}
                  </pre>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleReset}
                  className="text-red-700 border-red-200 hover:bg-red-100"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

---

## 2. FORM ERROR COMPONENT

**File:** `src/components/ui/form-error.tsx`

```typescript
import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message?: string;
  className?: string;
}

/**
 * Displays validation errors below form fields
 * 
 * Usage:
 * <FormError message={errors.email} />
 */
export function FormError({ message, className = "" }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium text-red-600 mt-1 ${className}`}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Form field wrapper with automatic error handling
 * 
 * Usage:
 * <FormField
 *   label="Email"
 *   error={errors.email}
 *   required
 * >
 *   <input {...register("email")} />
 * </FormField>
 */
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  helperText?: string;
  className?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  helperText,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {children}
      {error && <FormError message={error} />}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}
```

---

## 3. EMPTY STATE COMPONENT

**File:** `src/components/ui/empty-state.tsx`

```typescript
import { AlertCircle, FileX, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "inbox" | "file" | "alert" | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const ICONS = {
  inbox: Inbox,
  file: FileX,
  alert: AlertCircle,
};

/**
 * Display empty state when no data is available
 * 
 * Usage:
 * <EmptyState
 *   title="No reports found"
 *   description="Create your first report to get started"
 *   icon="file"
 *   action={{
 *     label: "Create Report",
 *     onClick: () => setShowCreate(true)
 *   }}
 * />
 */
export function EmptyState({
  title = "No data found",
  description = "There are no items to display.",
  icon = "inbox",
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  const IconComponent =
    typeof icon === "string" ? ICONS[icon] : icon;

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 gap-4 text-center ${className}`}
      role="status"
      aria-label="No data available"
    >
      {typeof IconComponent === "function" && (
        <IconComponent className="w-16 h-16 text-gray-300" aria-hidden="true" />
      )}

      <div className="max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {title}
        </h3>
        <p className="text-gray-500 text-sm mb-6">{description}</p>
      </div>

      {(action || secondaryAction) && (
        <div className="flex gap-3 justify-center flex-wrap">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 4. DATA LOADER COMPONENT

**File:** `src/components/ui/data-loader.tsx`

```typescript
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
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
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
```

---

## 5. CONFIRMATION DIALOG COMPONENT

**File:** `src/components/ui/confirm-dialog.tsx`

```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  icon?: "warning" | "info" | "none";
}

/**
 * Confirmation dialog for destructive or important actions
 * 
 * Usage:
 * const [showConfirm, setShowConfirm] = useState(false);
 * 
 * <ConfirmDialog
 *   open={showConfirm}
 *   title="Delete Report?"
 *   description="This action cannot be undone."
 *   destructive
 *   onConfirm={async () => {
 *     await deleteReport(reportId);
 *     setShowConfirm(false);
 *   }}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
export function ConfirmDialog({
  open,
  title = "Confirm Action",
  description = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
  icon = "info",
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(loading);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  const IconComponent = 
    icon === "warning" 
      ? AlertTriangle 
      : icon === "info" 
      ? Info 
      : null;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {IconComponent && (
              <IconComponent
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  destructive ? "text-red-600" : "text-blue-600"
                }`}
                aria-hidden="true"
              />
            )}
            <div className="flex-1">
              <DialogTitle className={destructive ? "text-red-900" : ""}>
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-2">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? "Loading..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6. INTEGRATION EXAMPLES

### Using Error Boundary in a Page

**File:** `src/app/(dashboardLayout)/reports/page.tsx`

```typescript
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { ReportsList } from "@/components/modules/reports/reports-list";

export default function ReportsPage() {
  return (
    <ErrorBoundary componentName="reports-page">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <ReportsList />
      </div>
    </ErrorBoundary>
  );
}
```

### Using DataLoader in a Component

**File:** `src/components/modules/reports/reports-list.tsx`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { DataLoader } from "@/components/ui/data-loader";
import { DataTable } from "@/components/ui/table";
import { getReports } from "@/services/reports.service";

export function ReportsList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: () => getReports(),
  });

  return (
    <DataLoader
      isLoading={isLoading}
      isEmpty={!data?.length}
      error={error}
      onRetry={() => refetch()}
    >
      <DataTable columns={reportColumns} data={data || []} />
    </DataLoader>
  );
}
```

### Using ConfirmDialog for Delete

**File:** `src/components/modules/reports/report-actions.tsx`

```typescript
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteReport } from "@/services/reports.service";
import { toast } from "sonner";

interface ReportActionsProps {
  reportId: string;
  onDeleted?: () => void;
}

export function ReportActions({
  reportId,
  onDeleted,
}: ReportActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: () => deleteReport(reportId),
    onSuccess: () => {
      toast.success("Report deleted successfully");
      setShowConfirm(false);
      onDeleted?.();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={deleteMutation.isPending}
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>

      <ConfirmDialog
        open={showConfirm}
        title="Delete Report?"
        description="This action cannot be undone. The report will be permanently deleted."
        confirmText="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
```

### Using FormField in a Form

**File:** `src/components/modules/forms/create-report-form.tsx`

```typescript
"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { FormField, FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createReport } from "@/services/reports.service";
import { toast } from "sonner";

export function CreateReportForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => createReport(data),
    onSuccess: () => {
      toast.success("Report created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <div className="space-y-6">
        <FormField
          label="Report Name"
          error={errors.name?.message}
          required
        >
          <Input
            {...register("name", {
              required: "Report name is required",
              minLength: {
                value: 3,
                message: "Name must be at least 3 characters",
              },
            })}
            placeholder="e.g., Monthly Settlement"
          />
        </FormField>

        <FormField
          label="Report Type"
          error={errors.type?.message}
          required
        >
          <Select {...register("type", { required: "Type is required" })}>
            <option value="">Select a type...</option>
            <option value="settlement">Settlement</option>
            <option value="reconciliation">Reconciliation</option>
            <option value="audit">Audit</option>
          </Select>
        </FormField>

        <FormField
          label="Description"
          error={errors.description?.message}
          helperText="Optional: Add details about this report"
        >
          <textarea
            {...register("description")}
            placeholder="Add a description..."
            className="w-full p-2 border rounded"
            rows={4}
          />
        </FormField>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Create Report"}
          </Button>
          <Button type="reset" variant="outline">
            Clear
          </Button>
        </div>
      </div>
    </form>
  );
}
```

---

## Summary

These components follow the UI Constitution guidelines and provide:

✅ **Consistency** - Standardized styling and patterns  
✅ **Accessibility** - ARIA labels and semantic HTML  
✅ **Reusability** - Flexible props and composition  
✅ **UX** - Loading states, error handling, confirmation dialogs  
✅ **Error Handling** - Graceful degradation and user feedback  

### Next Steps

1. Copy these components to your project
2. Customize styling to match your brand
3. Add to Storybook for documentation
4. Use in existing components
5. Test thoroughly before deploying

### Questions?

Refer to:
- `FRONTEND_AUDIT_UI_SENTRY.md` - Full audit report
- `SENTRY_IMPLEMENTATION_GUIDE.md` - Sentry setup details
- `UI.md` - UI Constitution guidelines
