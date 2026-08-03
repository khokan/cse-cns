/**
 * Helper utilities for TanStack Data Table
 * Provides date/time/currency formatters, column data presence detection,
 * sorting, and header formatting helpers.
 */

// ---------------------------------------------------------------------------
// Internal Regex Patterns
// ---------------------------------------------------------------------------
const RE_ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const RE_ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const RE_SPACE_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;

export type DateInput = string | Date | null | undefined;

/**
 * Unified Date & Format Utility Class
 */
export class DateFormatter {
  static isDateOnly(value: unknown): boolean {
    if (typeof value !== "string") return false;
    return RE_ISO_DATE_ONLY.test(value.trim());
  }

  static isDateTime(value: unknown): boolean {
    if (typeof value !== "string") return value instanceof Date;
    const t = value.trim();
    return RE_ISO_DATETIME.test(t) || RE_SPACE_DATETIME.test(t);
  }

  static dateOnly(dateString: DateInput): string {
    if (!dateString) return "—";
    try {
      if (typeof dateString === "string") {
        const trimmed = dateString.trim();
        if (trimmed.includes("T")) {
          const datePart = trimmed.split("T")[0];
          if (RE_ISO_DATE_ONLY.test(datePart)) return datePart;
        }
        if (trimmed.includes(" ")) {
          const datePart = trimmed.split(" ")[0];
          if (RE_ISO_DATE_ONLY.test(datePart)) return datePart;
        }
        if (RE_ISO_DATE_ONLY.test(trimmed)) return trimmed;

        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return DateFormatter._utcDateStr(date);
        }
        const ts = parseInt(trimmed, 10);
        if (!isNaN(ts)) return DateFormatter._utcDateStr(new Date(ts));
        return trimmed;
      } else {
        if (isNaN(dateString.getTime())) return "—";
        return DateFormatter._utcDateStr(dateString);
      }
    } catch {
      return "—";
    }
  }

  static dateTime(dateString: DateInput): string {
    if (!dateString) return "—";
    try {
      if (typeof dateString === "string") {
        const trimmed = dateString.trim();
        if (trimmed.includes("T")) {
          const [datePart, rawTime] = trimmed.split("T");
          if (RE_ISO_DATE_ONLY.test(datePart) && rawTime) {
            const timeClean = rawTime.replace(/[Z+\-]\d*:?\d*$/, "").split(".")[0];
            if (/^\d{2}:\d{2}:\d{2}$/.test(timeClean)) {
              return `${datePart} ${timeClean}`;
            }
          }
        }
        if (trimmed.includes(" ")) {
          const [datePart, timePart] = trimmed.split(" ");
          if (RE_ISO_DATE_ONLY.test(datePart) && /^\d{2}:\d{2}:\d{2}$/.test(timePart)) {
            return `${datePart} ${timePart}`;
          }
        }

        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return DateFormatter._utcDateTimeStr(date);
        }
        const ts = parseInt(trimmed, 10);
        if (!isNaN(ts)) return DateFormatter._utcDateTimeStr(new Date(ts));
        return trimmed;
      } else {
        if (isNaN(dateString.getTime())) return "—";
        return DateFormatter._utcDateTimeStr(dateString);
      }
    } catch {
      return "—";
    }
  }

  static timeOnly(dateString: DateInput): string {
    if (!dateString) return "—";
    try {
      if (typeof dateString === "string") {
        const trimmed = dateString.trim();
        if (trimmed.includes("T")) {
          const rawTime = trimmed.split("T")[1];
          if (rawTime) {
            const timeClean = rawTime.replace(/[Z+\-]\d*:?\d*$/, "").split(".")[0];
            if (/^\d{2}:\d{2}:\d{2}$/.test(timeClean)) return timeClean;
          }
        }
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

  static dateLabel(value: DateInput): string {
    if (!value) return "—";
    try {
      let d: Date;
      if (typeof value === "string") {
        const trimmed = value.trim();
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

  static compare(
    a: string | Date | null | undefined,
    b: string | Date | null | undefined
  ): number {
    const ta = a ? new Date(a).getTime() : 0;
    const tb = b ? new Date(b).getTime() : 0;
    return ta - tb;
  }

  static currency(amount: number | null | undefined, currency = "USD"): string {
    if (amount === null || amount === undefined) return "—";
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
    } catch {
      return String(amount);
    }
  }

  static percent(value: number | null | undefined, decimals = 2): string {
    if (value === null || value === undefined) return "—";
    return `${value.toFixed(decimals)}%`;
  }

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

// ---------------------------------------------------------------------------
// Format Utilities
// ---------------------------------------------------------------------------
export const formatDateOnly = (v: DateInput) => DateFormatter.dateOnly(v);
export const formatDateTime = (v: DateInput) => DateFormatter.dateTime(v);
export const formatTimeOnly = (v: DateInput) => DateFormatter.timeOnly(v);
export const dateComparator = (a: DateInput, b: DateInput) => DateFormatter.compare(a, b);
export const formatCurrency = (amount: number | null | undefined, currency?: string) =>
  DateFormatter.currency(amount, currency);
export const formatPercent = (value: number | null | undefined, decimals?: number) =>
  DateFormatter.percent(value, decimals);

// ---------------------------------------------------------------------------
// Column Data Analysis & Presence Detection Helpers
// ---------------------------------------------------------------------------

/**
 * Checks if a value contains meaningful non-empty data
 */
export const isNonEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !isNaN(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
};

export type ColumnDataPresence = {
  columnId: string;
  hasData: boolean;
  populatedCount: number;
  totalCount: number;
  percentage: number;
};

/**
 * Analyzes whether a specific column in a dataset contains non-empty data
 */
export const analyzeColumnData = <T extends object>(
  data: T[],
  columnId: string,
  accessorKey?: string | keyof T | ((row: T) => unknown)
): ColumnDataPresence => {
  if (!data || data.length === 0) {
    return {
      columnId,
      hasData: false,
      populatedCount: 0,
      totalCount: 0,
      percentage: 0,
    };
  }

  let count = 0;
  for (const row of data) {
    let val: unknown = undefined;
    if (typeof accessorKey === "function") {
      try {
        val = accessorKey(row);
      } catch {
        val = undefined;
      }
    } else if (typeof accessorKey === "string" || typeof accessorKey === "number") {
      val = (row as Record<string, unknown>)[String(accessorKey)];
    } else if (columnId && columnId in row) {
      val = (row as Record<string, unknown>)[columnId];
    }

    if (isNonEmptyValue(val)) {
      count++;
    }
  }

  return {
    columnId,
    hasData: count > 0,
    populatedCount: count,
    totalCount: data.length,
    percentage: Math.round((count / data.length) * 100),
  };
};

/**
 * Analyzes all columns in a dataset to determine data presence per column
 */
export const analyzeAllColumnsData = <T extends object>(
  data: T[],
  columns: any[]
): Record<string, ColumnDataPresence> => {
  const result: Record<string, ColumnDataPresence> = {};

  for (const col of columns) {
    const id =
      col.id ||
      (typeof col.accessorKey === "string" ? col.accessorKey : undefined) ||
      (typeof col.header === "string" ? col.header : undefined);

    if (!id) continue;

    result[id] = analyzeColumnData(data, id, col.accessorKey || col.accessorFn);
  }

  return result;
};

/**
 * Computes initial column visibility state, hiding empty columns if requested
 */
export const getInitialColumnVisibility = <T extends object>(
  data: T[],
  columns: any[],
  hideEmpty: boolean = false
): Record<string, boolean> => {
  const visibility: Record<string, boolean> = {};
  if (!data || data.length === 0 || !hideEmpty) return visibility;

  const analysis = analyzeAllColumnsData(data, columns);
  for (const [colId, presence] of Object.entries(analysis)) {
    if (!presence.hasData) {
      visibility[colId] = false;
    }
  }

  return visibility;
};

/**
 * Formats a raw column identifier or header definition into a clean title
 */
export const getColumnLabel = (col: any): string => {
  if (typeof col.columnDef?.header === "string") {
    return col.columnDef.header;
  }
  if (typeof col.header === "string") {
    return col.header;
  }
  const rawId = col.id || col.accessorKey || "";
  if (!rawId) return "Column";

  return String(rawId)
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
};
