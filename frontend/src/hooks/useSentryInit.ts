"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export function useSentryInit() {
  useEffect(() => {
    // Initialize Sentry client-side
    if (typeof window !== "undefined") {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate:
          process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        replaysSessionSampleRate:
          process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0,
      });
    }
  }, []);
}