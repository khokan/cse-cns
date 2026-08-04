"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/utils/authUtils";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProtectedPageProps {
  children: React.ReactNode;
  userRole?: string;
  allowedRoles: UserRole[];
  fallbackMessage?: string;
}

/**
 * ProtectedPage Component
 * Ensures only authorized users can access the page
 * Displays an alert if user doesn't have permission
 */
export function ProtectedPage({
  children,
  userRole = "TRECHOLDER",
  allowedRoles,
  fallbackMessage = "You don't have permission to access this page",
}: ProtectedPageProps) {
  const router = useRouter();
  const hasAccess = allowedRoles.includes(userRole as UserRole);

  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fallbackMessage}</AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
