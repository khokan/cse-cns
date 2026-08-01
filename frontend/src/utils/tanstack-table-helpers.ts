/**
 * DateFormatter — single source of truth for all date/time formatting
 * across tables, views, and chart labels throughout the application.
 *
 * Usage:
 *   import { DateFormatter } from "@/components/modules/common/tanstack-table-helpers";
 *
 *   DateFormatter.dateOnly("2026-07-30T09:06:14.596Z")  // "2026-07-30"
 *   DateFormatter.dateTime("2026-07-30T09:06:14.596Z")  // "2026-07-30 09:06:14"
 *   DateFormatter.dateLabel("2026-07-30")               // "30 Jul '26"
 *   DateFormatter.cell("2026-07-30T09:06:14.596Z")      // auto: "2026-07-30 09:06:14"
 *   DateFormatter.cell("2026-07-30")                    // auto: "2026-07-30"
 *   DateFormatter.cell(true)                            // "Yes"
 *   DateFormatter.cell(42.5)                            // "42.5"
 */

// ---------------------------------------------------------------------------
// Internal regex constants — not exported; use the class methods instead
// ---------------------------------------------------------------------------
const RE_ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const RE_ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const RE_SPACE_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;

type DateInput = string | Date | null | undefined;

export class DateFormatter {
  // -------------------------------------------------------------------------
  // isDateOnly — returns true when value is exactly "YYYY-MM-DD"
  // -------------------------------------------------------------------------
  static isDateOnly(value: unknown): boolean {
    if (typeof value !== "string") return false;
    return RE_ISO_DATE_ONLY.test(value.trim());
  }

  // -------------------------------------------------------------------------
  // isDateTime — returns true when value looks like an ISO 8601 or
  // space-separated datetime string (has both date AND time parts)
  // -------------------------------------------------------------------------
  static isDateTime(value: unknown): boolean {
    if (typeof value !== "string") return value instanceof Date;
    const t = value.trim();
    return RE_ISO_DATETIME.test(t) || RE_SPACE_DATETIME.test(t);
  }

  // -------------------------------------------------------------------------
  // dateOnly — "YYYY-MM-DD"
  // Works with ISO 8601, space-separated datetime, date-only strings,
  // Date objects, unix timestamps (ms as string), and bare date strings.
  // Always reads UTC to avoid timezone-induced day shifts.
  // -------------------------------------------------------------------------
  static dateOnly(dateString: DateInput): string {
    if (!dateString) return "—";
    try {
      if (typeof dateString === "string") {
        const trimmed = dateString.trim();

        // ISO 8601: "2026-07-30T09:06:14.596Z"
        if (trimmed.includes("T")) {
          const datePart = trimmed.split("T")[0];
          if (RE_ISO_DATE_ONLY.test(datePart)) return datePart;
        }

        // Space-separated: "2026-07-30 09:06:14"
        if (trimmed.includes(" ")) {
          const datePart = trimmed.split(" ")[0];
          if (RE_ISO_DATE_ONLY.test(datePart)) return datePart;
        }

        // Already bare date
        if (RE_ISO_DATE_ONLY.test(trimmed)) return trimmed;

        // Fallback: try Date parse (UTC read to avoid offset)
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return DateFormatter._utcDateStr(date);
        }

        // Last resort: unix timestamp in ms
        const ts = parseInt(trimmed, 10);
        if (!isNaN(ts)) return DateFormatter._utcDateStr(new Date(ts));

        return trimmed;
      } else {
        // Date object
        if (isNaN(dateString.getTime())) return "—";
        return DateFormatter._utcDateStr(dateString);
      }
    } catch {
      return "—";
    }
  }

  // -------------------------------------------------------------------------
  // dateTime — "YYYY-MM-DD HH:mm:ss"
  // Always reads UTC parts to match the stored UTC value exactly.
  // -------------------------------------------------------------------------
  static dateTime(dateString: DateInput): string {
    if (!dateString) return "—";
    try {
      if (typeof dateString === "string") {
        const trimmed = dateString.trim();

        // Fast-path ISO 8601: "2026-07-30T09:06:14.596Z"
        if (trimmed.includes("T")) {
          const [datePart, rawTime] = trimmed.split("T");
          if (RE_ISO_DATE_ONLY.test(datePart) && rawTime) {
            // Strip trailing Z / +HH:MM / -HH:MM and milliseconds
            const timeClean = rawTime.replace(/[Z+\-]\d*:?\d*$/, "").split(".")[0];
            if (/^\d{2}:\d{2}:\d{2}$/.test(timeClean)) {
              return `${datePart} ${timeClean}`;
            }
          }
        }

        // Fast-path space-separated: "2026-07-30 09:06:14"
        if (trimmed.includes(" ")) {
          const [datePart, timePart] = trimmed.split(" ");
          if (
            RE_ISO_DATE_ONLY.test(datePart) &&
            /^\d{2}:\d{2}:\d{2}$/.test(timePart)
          ) {
            return `${datePart} ${timePart}`;
          }
        }

        // Fallback: parse and read UTC
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return DateFormatter._utcDateTimeStr(date);
        }

        // Unix timestamp in ms
        const ts = parseInt(trimmed, 10);
        if (!isNaN(ts)) return DateFormatter._utcDateTimeStr(new Date(ts));

        return trimmed;
      } else {
        // Date object
        if (isNaN(dateString.getTime())) return "—";
        return DateFormatter._utcDateTimeStr(dateString);
      }
    } catch {
      return "—";
    }
  }

  // -------------------------------------------------------------------------
  // timeOnly — "HH:mm:ss" (UTC)
  // -------------------------------------------------------------------------
  static timeOnly(dateString: DateInput): string {
    if (!dateString) return "—";
    try {
      if (typeof dateString === "string") {
        const trimmed = dateString.trim();

        // ISO 8601 fast-path
        if (trimmed.includes("T")) {
          const rawTime = trimmed.split("T")[1];
          if (rawTime) {
            const timeClean = rawTime.replace(/[Z+\-]\d*:?\d*$/, "").split(".")[0];
            if (/^\d{2}:\d{2}:\d{2}$/.test(timeClean)) return timeClean;
          }
        }

        // Space-separated
        if (trimmed.includes(" ")) {
          const timePart = trimmed.split(" ")[1];
          if (/^\d{2}:\d{2}:\d{2}$/.test(timePart)) return timePart;
        }
      }

      const date = typeof dateString === "string" ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return "—";
      const h = String(date.getUTCHours()).padStart(2, "0");
      const m = String(date.getUTCMinutes()).padStart(2, "0");
      const s = String(date.getUTCSeconds()).padStart(2, "0");
      return `${h}:${m}:${s}`;
    } catch {
      return "—";
    }
  }

  // -------------------------------------------------------------------------
  // dateLabel — human-readable short label for charts and UI text
  // e.g. "30 Jul '26"  (matches existing ReconciliationDashboard formatDate)
  // -------------------------------------------------------------------------
  static dateLabel(value: DateInput): string {
    if (!value) return "—";
    try {
      let d: Date;
      if (typeof value === "string") {
        const trimmed = value.trim();
        // Bare date: parse as UTC midnight to avoid off-by-one
        if (RE_ISO_DATE_ONLY.test(trimmed)) {
          const [y, mo, da] = trimmed.split("-").map(Number);
          d = new Date(Date.UTC(y, mo - 1, da));
        } else {
          d = new Date(trimmed);
        }
      } else {
        d = value;
      }
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      });
    } catch {
      return "—";
    }
  }

  // -------------------------------------------------------------------------
  // cell — smart auto-detect for generic table cells
  //
  // Rules:
  //   • null / undefined       → "—"
  //   • Date object            → dateTime
  //   • string with T (ISO 8601 datetime) → dateTime
  //   • string with space-datetime       → dateTime
  //   • string matching YYYY-MM-DD only  → dateOnly
  //   • boolean                → "Yes" / "No"
  //   • anything else          → String(value)
  // -------------------------------------------------------------------------
  static cell(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (value instanceof Date) return DateFormatter.dateTime(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string") {
      const t = value.trim();
      if (RE_ISO_DATETIME.test(t) || RE_SPACE_DATETIME.test(t)) {
        return DateFormatter.dateTime(t);
      }
      if (RE_ISO_DATE_ONLY.test(t)) {
        return DateFormatter.dateOnly(t);
      }
    }
    return String(value);
  }

  // -------------------------------------------------------------------------
  // compare — sort comparator for date columns (ascending)
  // -------------------------------------------------------------------------
  static compare(
    a: string | Date | null | undefined,
    b: string | Date | null | undefined
  ): number {
    const ta = a ? new Date(a).getTime() : 0;
    const tb = b ? new Date(b).getTime() : 0;
    return ta - tb;
  }

  // -------------------------------------------------------------------------
  // currency — Intl-formatted currency string
  // -------------------------------------------------------------------------
  static currency(amount: number | null | undefined, currency = "USD"): string {
    if (amount === null || amount === undefined) return "—";
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
    } catch {
      return String(amount);
    }
  }

  // -------------------------------------------------------------------------
  // percent — e.g. "12.34%"
  // -------------------------------------------------------------------------
  static percent(value: number | null | undefined, decimals = 2): string {
    if (value === null || value === undefined) return "—";
    return `${value.toFixed(decimals)}%`;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------
  private static _utcDateStr(d: Date): string {
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const da = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }

  private static _utcDateTimeStr(d: Date): string {
    const base = DateFormatter._utcDateStr(d);
    const h = String(d.getUTCHours()).padStart(2, "0");
    const m = String(d.getUTCMinutes()).padStart(2, "0");
    const s = String(d.getUTCSeconds()).padStart(2, "0");
    return `${base} ${h}:${m}:${s}`;
  }
}

// =============================================================================
// Backward-compatible named exports — existing imports continue to work
// without any changes at the call sites.
// =============================================================================
export const formatDateOnly  = (v: DateInput) => DateFormatter.dateOnly(v);
export const formatDateTime  = (v: DateInput) => DateFormatter.dateTime(v);
export const formatTimeOnly  = (v: DateInput) => DateFormatter.timeOnly(v);
export const dateComparator  = (a: DateInput, b: DateInput) => DateFormatter.compare(a, b);
export const formatCurrency  = (amount: number | null | undefined, currency?: string) =>
  DateFormatter.currency(amount, currency);
export const formatPercent   = (value: number | null | undefined, decimals?: number) =>
  DateFormatter.percent(value, decimals);
