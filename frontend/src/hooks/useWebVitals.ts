/**
 * Performance Monitoring Hook using Sentry
 * Tracks Core Web Vitals, navigation timing, and long tasks
 */

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Initialize performance monitoring with Sentry
 * Call this hook in your root layout component
 */
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Sentry automatically captures web vitals with the performance integration
    // This hook ensures Sentry is properly initialized for performance monitoring
    
    // Set user context if available
    const userId = localStorage.getItem("userId");
    if (userId) {
      Sentry.setUser({ id: userId });
    }

    // Capture page navigation
    const handlePageShow = () => {
      Sentry.captureMessage("Page Loaded", { level: "info" });
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
}

/**
 * Track navigation performance using Sentry
 */
export function useNavigationTiming() {
  useEffect(() => {
    if (typeof window === "undefined" || !("performance" in window)) return;

    const handleLoad = () => {
      try {
        const perfData = window.performance.getEntriesByType("navigation")[0] as unknown;
        
        if (perfData && typeof perfData === "object") {
          const data = perfData as Record<string, unknown>;
          const navigationStart = (data.navigationStart as number) || 0;
          const responseEnd = (data.responseEnd as number) || 0;
          const domInteractive = (data.domInteractive as number) || 0;
          const loadEventEnd = (data.loadEventEnd as number) || 0;

          const ttfb = responseEnd - navigationStart;
          const domTime = domInteractive - navigationStart;
          const totalTime = loadEventEnd - navigationStart;

          Sentry.captureMessage("Navigation Performance", {
            tags: {
              source: "navigation-timing",
              ttfb: ttfb.toFixed(0),
              "dom-time": domTime.toFixed(0),
              "total-time": totalTime.toFixed(0),
            },
            level: "info",
          });
        }
      } catch {
        // Navigation timing not available
      }
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);
}

/**
 * Track long tasks using Sentry
 */
export function useLongTaskTracking() {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = (entry as unknown as Record<string, number>).duration || 0;

          if (duration > 100) {
            // Report tasks over 100ms
            Sentry.captureMessage(`Long Task: ${duration.toFixed(0)}ms`, {
              tags: {
                source: "long-task-observer",
                duration: duration.toFixed(0),
              },
              level: "warning",
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ["longtask"] });
      } catch {
        // Long tasks observer not supported in this browser
      }

      return () => observer.disconnect();
    } catch {
      // PerformanceObserver not supported
    }
  }, []);
}
