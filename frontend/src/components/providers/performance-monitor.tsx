"use client";

import { useWebVitals, useNavigationTiming, useLongTaskTracking } from "@/hooks/useWebVitals";

/**
 * Performance monitoring provider component
 * Tracks web vitals, navigation timing, and long tasks
 */
export function PerformanceMonitor() {
  // Initialize all performance tracking
  useWebVitals();
  useNavigationTiming();
  useLongTaskTracking();

  return null;
}
