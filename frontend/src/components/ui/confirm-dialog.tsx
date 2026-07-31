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
                className={`w-5 h-5 mt-0.5 shrink-0 ${
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
            className="min-w-25"
          >
            {isLoading ? "Loading..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
