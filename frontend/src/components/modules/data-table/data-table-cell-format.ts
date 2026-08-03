/**
 * formatCellValue — lightweight, dependency-free cell formatter for the
 * generic data table (kept local to `components/modules/data-table` so this
 * module doesn't reach into the legacy `components/modules/dataTable` folder).
 *
 * Handles the common shapes returned by the generic `/data/:table` API:
 * ISO datetimes, bare dates, booleans, numbers, null/undefined, and plain
 * strings/objects.
 */
const RE_ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const RE_ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "number") return String(value);

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return "—";
    return value.toISOString().replace("T", " ").slice(0, 19);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (RE_ISO_DATETIME.test(trimmed)) {
      const [datePart, rawTime] = trimmed.split("T");
      const timeClean = rawTime.replace(/[Z+-]\d*:?\d*$/, "").split(".")[0];
      return `${datePart} ${timeClean}`;
    }

    if (RE_ISO_DATE_ONLY.test(trimmed)) return trimmed;

    return trimmed;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}
