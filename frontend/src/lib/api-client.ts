// ---------------------------------------------------------------------------
// Shared API client — single fetch wrapper used by every *.service.ts file.
// Centralizes base URL resolution, credentials, JSON headers and error
// normalization so individual services stay focused on their own endpoints.
// Works in both browser and server rendering contexts.
// ---------------------------------------------------------------------------

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
      return { data: null, error: { message: json?.message ?? "Request failed" } };
    }

    return { data: json, error: null };
  } catch {
    return { data: null, error: { message: "Network error. Please try again." } };
  }
}
