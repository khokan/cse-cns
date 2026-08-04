"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

export type CrudDialogMode = "create" | "edit" | "view";

interface CrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CrudDialogMode;
  title: string;
  description?: string;
  children: ReactNode;
  isLoading?: boolean;
  onSubmit?: () => void | Promise<void>;
  onCancel?: () => void;
  submitButtonLabel?: string;
  cancelButtonLabel?: string;
  showFooter?: boolean;
  isDirty?: boolean;
}

/**
 * Generic CRUD Dialog Component
 * Reusable for Create, Edit, and View operations
 */
export function CrudDialog({
  open,
  onOpenChange,
  mode,
  title,
  description,
  children,
  isLoading = false,
  onSubmit,
  onCancel,
  submitButtonLabel = mode === "view" ? "Close" : mode === "create" ? "Create" : "Update",
  cancelButtonLabel = "Cancel",
  showFooter = true,
  isDirty = true,
}: CrudDialogProps) {
  const handleSubmit = async () => {
    if (onSubmit) {
      try {
        await onSubmit();
        onOpenChange(false);
      } catch {
        // Error handling is done in mutation callbacks
      }
    } else if (mode === "view") {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const isViewMode = mode === "view";
  const modeStyles = {
    create: "bg-blue-50 border-blue-200",
    edit: "bg-amber-50 border-amber-200",
    view: "bg-gray-50 border-gray-200",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
        <DialogHeader className={`px-6 py-4 ${modeStyles[mode]} rounded-t-lg`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1">{description}</DialogDescription>
              )}
            </div>
            <button
              onClick={() => handleCancel()}
              className="rounded-md p-1 hover:bg-white/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">{children}</div>

        {showFooter && (
          <div className="flex gap-2 border-t bg-gray-50 px-6 py-4 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-24"
            >
              {cancelButtonLabel}
            </Button>
            {!isViewMode && (
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !isDirty}
                className="w-24"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitButtonLabel}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CrudDialog;
