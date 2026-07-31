"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error, {
      tags: {
        component: "root-error-handler",
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Oops!</h1>
        </div>

        <p className="text-gray-600 mb-4">
          Something went wrong. We've been notified and will look into it.
        </p>

        <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded font-mono break-all">
          Error ID: {error.digest || "unknown"}
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={reset} className="flex-1">
            Try Again
          </Button>
          <Button
            variant="default"
            onClick={() => (window.location.href = "/")}
            className="flex-1"
          >
            Go Home
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Our team is investigating. Please refresh or come back shortly.
        </p>
      </div>
    </div>
  );
}