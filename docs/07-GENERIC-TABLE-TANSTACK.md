# Generic Data Table (TanStack Table)

## Concept
Rather than building a bespoke CRUD UI + API per entity, the system implements a **registry-driven generic table** on both backend and frontend, allowing new tables to be exposed for CRUD with minimal code.

## Backend: Table Registry
`backend/src/app/modules/datatable/datatable.registry.ts` maps a `tableKey` (string) to:
- `db`: `"cns" | "cnsweb"` — which Prisma client to use
- `model`: Prisma model/delegate name
- `primaryKey`: field name used for lookups/updates
- `idType`: `"bigint" | "int" | "string"` — how to parse the incoming ID param
- `readRoles` / `writeRoles`: which `UserRoleType`s can read/write this table
- `searchableFields`: fields eligible for free-text `search` query param

`datatable.service.ts` (`getAccessibleTables`, `listRows`, `getRow`, `createRow`, `updateRow`, `deleteRow`) is fully generic — it resolves the Prisma delegate dynamically (`db[dbName][modelName]`), builds `where` from search + arbitrary filter query params, applies pagination (`page`/`limit`/`skip`), sorting (`sortBy`/`sortOrder`), and serializes BigInt fields. Role checks (`readRoles`/`writeRoles`) are enforced per operation, and writes trigger `writeAuditLog`.

## Frontend: Hooks + Component
- `hooks/useDatatable.ts` — TanStack Query hooks: `useAccessibleTables`, `useDatatableRows`, `useDatatableRow`, `useCreateRow`, `useUpdateRow`, `useDeleteRow`. Each mutation invalidates the relevant query keys and surfaces toast notifications (success/error) via `sonner`.
- `components/modules/datatable/GenericDataTable.tsx` — Renders any table's rows using **TanStack Table** (`ColumnDef[]`) by dynamically deriving columns from the union of keys present in the row data. Uses a shared `TanstackDataTable` wrapper (`components/modules/common/tanstack-data-table`) and `DateFormatter.cell` (from `utils/tanstack-table-helpers`) to auto-format date-like values in any column.
- `components/modules/datatable/RowCreateEditDialog.tsx` — Generic create/edit form dialog driven by a `FieldSchema[]` (derived from row keys, marking the primary key as read-only), so no per-table form needs to be hand-built.

## Data Flow
1. `useAccessibleTables()` → `GET /data/tables` → user sees only tables allowed for their role.
2. Selecting a table calls `useDatatableRows(table, params)` → `GET /data/:table` with pagination/search/sort params.
3. `GenericDataTable` renders rows/columns dynamically; `canWrite` (returned in API meta) toggles Create/Edit/Delete UI affordances.
4. Create/Update/Delete go through `useCreateRow`/`useUpdateRow`/`useDeleteRow`, which call the datatable service, invalidate cached queries, and show toast feedback.

## Benefits
- Single generic controller/service/UI triplet supports many DB tables/models across both `cns` and `cnsweb` databases.
- Adding a new manageable table only requires a new registry entry (backend) — no new route, controller, or React component needed.
- Role-based read/write enforcement and audit logging are automatically applied to every registered table.

## Sorting & Datetime Formatting
The shared `TanstackDataTable` wrapper supports clickable, sortable column headers (`enableSorting: true` per `ColumnDef`) with ascending/descending indicator cycling, row-selection checkboxes, and bulk actions (export/delete). Datetime columns use helper formatters (`utils/tanstack-table-helpers` — e.g. `DateFormatter.cell` / `formatDateOnly`) to render either a date-only or full datetime string from the raw ISO 8601 UTC value returned by Prisma.

### Important Gotcha: Two Different Audit Log Renderers
Audit log data is surfaced on **two separate screens using two separate components**, which do not share column/formatting configuration even though both are built on `TanstackDataTable`:

| Screen | Route | Component | Column header style |
|---|---|---|---|
| Admin dashboard | `/admin/dashboard` | `AuditLogViewer` | Hand-written headers (`Date`, `Action`, `Entity`, `User`, `Entity ID`) |
| Generic CRUD browser | `/data/auditLog` | `GenericDataTable` | Auto-derived from raw field names (e.g. `createdAt`) |

Both consume the same underlying `AuditLog.createdAt` (Prisma `DateTime`) data, but since each supplies its own `ColumnDef[]`, date formatting and header labels must be updated in **both** places if changed — editing one has no effect on the other.
