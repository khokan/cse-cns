// ---------------------------------------------------------------------------
// Shared API client — single fetch wrapper used by every *.service.ts file.
// Centralizes base URL resolution, credentials, JSON headers and error
// normalization so individual services stay focused on their own endpoints.
// Works in both browser and server rendering contexts.
// ---------------------------------------------------------------------------

import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export type ApiResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

/**
 * Builds a query string from a params object, skipping null/undefined/"" values.
 */
export function buildQueryString<T extends object>(params?: T): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v != null && v !== ""
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

async function getServerCookieHeader(): Promise<string | undefined> {
  if (typeof window !== "undefined") return undefined;
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.toString();
  } catch {
    return undefined;
  }
}

/**
 * Generic fetch wrapper with cookie-based credentials, JSON headers and
 * normalized `{ data, error }` result shape.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const cookieHeader = await getServerCookieHeader();

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...(options.headers ?? {}),
      },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage = json?.message ?? "Request failed";
      
      // Don't capture 4xx errors as exceptions, but track them
      if (res.status >= 400 && res.status < 500) {
        Sentry.captureMessage(`API Client Error: ${options.method || "GET"} ${path}`, {
          level: "warning",
          tags: {
            status: res.status,
            method: options.method || "GET",
            url: path,
          },
        });
      } else {
        // Capture 5xx errors
        Sentry.captureException(new Error(errorMessage), {
          tags: {
            status: res.status,
            method: options.method || "GET",
            url: path,
          },
        });
      }

      // Show toast notification for user
      if (res.status === 401) {
        toast?.error?.("Session expired. Please login again.");
      } else if (res.status === 403) {
        toast?.error?.("You don't have permission for this action.");
      } else if (res.status === 404) {
        toast?.error?.("Resource not found.");
      } else if (res.status >= 500) {
        toast?.error?.("Server error. Please try again later.");
      }

      return { data: null, error: { message: errorMessage } };
    }

    return { data: json, error: null };
  } catch (error) {
    // Capture network errors
    Sentry.captureException(error, {
      tags: {
        source: "api-client",
        path: path,
      },
    });

    const errorMessage = error instanceof Error ? error.message : "Network error. Please try again.";
    if (typeof window !== "undefined") {
      toast?.error?.(errorMessage);
    }
    
    return { data: null, error: { message: errorMessage } };
  }
}
