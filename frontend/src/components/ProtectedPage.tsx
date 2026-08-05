"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/utils/authUtils";
import { AlertCircle, ShieldX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProtectedPageProps {
  children: React.ReactNode;
  userRole?: string;
  allowedRoles: UserRole[];
  fallbackMessage?: string;
  /**
   * Optional permission gate — checked in addition to role.
   * This is a UI-layer guard only; backend enforces the real check.
   */
  requiredPermission?: {
    module: string;
    action: string;
    /** Pass req.permission.allowed from session or a parent loader */
    allowed: boolean;
  };
}

/**
 * ProtectedPage Component
 * Ensures only authorized users can access the page.
 * Optionally checks a specific module+action permission (UI-layer).
 */
export function ProtectedPage({
  children,
  userRole = "TRECHOLDER",
  allowedRoles,
  fallbackMessage = "You don't have permission to access this page",
  requiredPermission,
}: ProtectedPageProps) {
  const router = useRouter();
  const hasRoleAccess = allowedRoles.includes(userRole as UserRole);
  const hasPermissionAccess = requiredPermission ? requiredPermission.allowed : true;
  const hasAccess = hasRoleAccess && hasPermissionAccess;

  const message =
    !hasRoleAccess
      ? fallbackMessage
      : !hasPermissionAccess
      ? `You don't have '${requiredPermission?.action}' permission on '${requiredPermission?.module}'.`
      : fallbackMessage;

  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            <ShieldX className="h-4 w-4 shrink-0" />
            {message}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            id="protected-go-back-btn"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            id="protected-go-home-btn"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
