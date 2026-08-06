# Unified DateFormatter Helper Class

## Background

Date formatting logic is currently scattered across 3 separate places:

| Location | What it does |
|---|---|
| `tanstack-table-helpers.ts` | `formatDateOnly`, `formatDateTime`, `formatTimeOnly`, `dateComparator` — exported individually |
| `GenericDataTable.tsx` | Duplicates regex constants (`ISO_DATETIME`, `ISO_DATE_ONLY`) + a local `formatCellValue()` that wraps the above |
| `ReconciliationDashboard.tsx` | Its own private `formatDate()` fn using `toLocaleDateString` — divergent from the others |

**Goal:** Consolidate everything into a single `DateFormatter` class (a static-method class acting as a namespace) inside `tanstack-table-helpers.ts`, eliminate all duplication, and update every consumer to import from the single source.

---

## Proposed Changes

### 1. `tanstack-table-helpers.ts` — [MODIFY]

Replace the file with a `DateFormatter` class containing all static methods **plus** keep the existing named exports as thin re-exports from the class for backward-compatibility.

**Class API:**

```ts
DateFormatter.dateOnly(value)          // → "YYYY-MM-DD" or "—"
DateFormatter.dateTime(value)          // → "YYYY-MM-DD HH:mm:ss" or "—"
DateFormatter.timeOnly(value)          // → "HH:mm:ss" or "—"
DateFormatter.dateLabel(value)         // → "01 Aug '26" (human-readable, for charts/UI labels)
DateFormatter.cell(value)             // → auto-detects: dateTime if has time, dateOnly if date-only, else raw string
DateFormatter.isDateOnly(value)       // → boolean (YYYY-MM-DD shape)
DateFormatter.isDateTime(value)       // → boolean (ISO 8601 with T or space-separated datetime)
DateFormatter.compare(a, b)           // → sort comparator number
DateFormatter.currency(amount, code)  // → formatted currency
DateFormatter.percent(value, dec)     // → "x.xx%"
```

Backward-compat re-exports (so no existing imports break):
```ts
export const formatDateOnly = DateFormatter.dateOnly.bind(DateFormatter);
export const formatDateTime = DateFormatter.dateTime.bind(DateFormatter);
export const formatTimeOnly = DateFormatter.timeOnly.bind(DateFormatter);
export const dateComparator = DateFormatter.compare.bind(DateFormatter);
export const formatCurrency = DateFormatter.currency.bind(DateFormatter);
export const formatPercent  = DateFormatter.percent.bind(DateFormatter);
```

---

### 2. `GenericDataTable.tsx` — [MODIFY]

- Remove local `ISO_DATETIME`, `ISO_DATE_ONLY` regex constants
- Remove local `formatCellValue()` function
- Replace with `DateFormatter.cell(value)` — the smart auto-detect method
- Remove explicit `dateOnly` flag and `DATE_ONLY_COLUMNS` map (GenericDataTable no longer needs to special-case per-table columns; the auto-detection handles it)
- Import only `DateFormatter` from helpers

---

### 3. `AuditLogViewer.tsx` — [MODIFY]

- Switch from `formatDateTime(value as string)` to `DateFormatter.dateTime(value as string)`
- Remove `formatDateOnly` from the import (it was imported but unused in the current version)

---

### 4. `ReconciliationDashboard.tsx` — [MODIFY]

- Replace the private `formatDate()` function with `DateFormatter.dateLabel()`
- Import `DateFormatter` from `tanstack-table-helpers`

---

## Open Questions

> [!NOTE]
> `DATE_ONLY_COLUMNS` in GenericDataTable currently marks `auditLog.createdAt` as date-only. Removing it means `createdAt` will now auto-detect as **dateTime** (correct behaviour). This is actually a fix, not a regression.

> [!NOTE]
> `ReconciliationDashboard.formatDate()` uses `toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"2-digit" })` which gives `"01 Aug '26"` style output for chart labels. The new `DateFormatter.dateLabel()` will replicate this exactly so charts remain unchanged.

---

## Verification Plan

- TypeScript build check (`tsc --noEmit`) — no new errors
- All existing import paths remain valid (backward-compat re-exports)
- `GenericDataTable` still renders booleans as Yes/No and raw strings unchanged
- `AuditLogViewer` `createdAt` now shows full datetime
- `ReconciliationDashboard` chart labels unchanged
