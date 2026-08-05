# Frontend Overview

## Stack
- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS, shadcn/ui (`components.json`) for base UI primitives
- **State/Data:** TanStack Query (React Query) for server-state, custom hooks for feature logic
- **Tables:** TanStack Table (generic data table module)
- **Auth:** `better-auth/react` client
- **Realtime:** Socket.IO client (`lib/socket.ts`) for job status push updates
- **Monitoring:** Sentry (browser + web-vitals)
- **Package manager:** pnpm (workspace-aware via `pnpm-workspace.yaml`)

## Directory Structure (`frontend/src`)
```
actions/         Server actions (e.g. trecholder.action.ts)
app/             Next.js App Router routes
  (auth)/        Auth route group (login, etc.)
  (dashboardLayout)/  Authenticated dashboard route group
  api/           Next.js route handlers (BFF endpoints, e.g. /api/ui/logout)
  debug/         Debug/diagnostic pages
components/
  modules/       Feature-specific components (admin, datatable, reports, settlement, home, login, Auth, dashboard)
  providers/     App-wide context providers (query client, theme, sentry, etc.)
  shared/        Shared layout components (navbar, footer, error-boundary, logout-button)
  ui/            shadcn/ui primitive components
constants/       Static config (reportConstants.ts, roles.ts)
hooks/           Reusable hooks (see below)
lib/             API client, auth client, socket, error helpers
services/        Typed API service wrappers per domain
types/           Shared TypeScript types
utils/           Utility helpers (e.g. tanstack-table-helpers, date formatting)
zod/             Zod validation schemas
```

## Key Hooks
| Hook | Purpose |
|---|---|
| `useChallan.ts` | **[NEW]** CRUD queries/mutations for Challan module with proper Promise-based callbacks |
| `useTaxToNBR.ts` | **[NEW]** CRUD queries/mutations for Tax-to-NBR module with proper Promise-based callbacks |
| `useDatatable.ts` | CRUD queries/mutations for the generic datatable module (TanStack Query) |
| `useBulkActions.ts` | Bulk operations against admin/data endpoints |
| `useReconciliation.ts` | Reconciliation dashboard data fetching |
| `useReportJobs.ts` | Report job creation, listing, polling |
| `useJobStatus.ts` | Subscribes to Socket.IO `report:status` / `settlement:status` events for realtime job updates |
| `useSentryInit.ts` | Initializes Sentry on the client |
| `useWebVitals.ts` | Captures and reports Core Web Vitals |

## Services Layer
`src/services/*.service.ts` wraps `lib/api-client.ts` (a typed fetch/axios wrapper) for:
- `admin.service.ts`, `bulk-operations.service.ts`, `challan.service.ts`, `datatable.service.ts`, `reconciliation.service.ts`, `report.service.ts`, `settlement.service.ts`, `taxToNBR.service.ts`, `trecholder.service.ts`, `user.service.ts`

Each service returns a consistent `{ data, error }` shape consumed by hooks, decoupling UI components from raw fetch/axios calls. **[NEW]** `challan.service.ts` and `taxToNBR.service.ts` provide typed endpoints for CRUD operations on these modules.

## Auth Client
`lib/auth-client.ts` creates a `better-auth/react` client with `credentials: "include"` so session cookies flow with cross-origin requests. `signOutUser()` calls `authClient.signOut()` then hits a Next.js route (`/api/ui/logout`) as a fallback to guarantee cookies are cleared server-side.

## Feature Modules (`components/modules`)
- `admin/`, `admin-dashboard/` — admin management screens
- `Auth/`, `login/` — authentication UI
- `challan/` — **[NEW]** Challan management with CrudDialog, form validation, and bulk operations
- `taxToNBR/` — **[NEW]** Tax-to-NBR record management with full CRUD and edit page
- `datatable/` — generic CRUD table (see dedicated Generic Table document)
- `reports/` — report generation UI (see Report Engine document)
- `settlement/` — settlement dashboards
- `reconciliation` — surfaced through hooks/services, dashboards under `dashboard/`/`Borad/`
- `common/`, `home/` — shared/landing components
- `shared/` — Reusable components like `CrudDialog` for consistent form workflows

## Build & Config
- `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `tsconfig.json`
- `sentry.config.ts` at project root wires Sentry into the Next.js build
- `pnpm-workspace.yaml` indicates a monorepo-style workspace shared with backend tooling

## App Composition Layers
The root layout composes providers in this nesting order:
`layout.tsx` → Sentry error boundary → Theme Provider → Query Providers (React Query) → Pages/Components. Individual pages/components are further wrapped by a local `ErrorBoundary` where needed for scoped error containment.

## Note
This document, along with the other 9 files in `docs/summary/`, is the single source of truth for project documentation. All previous historical/legacy docs (audits, checklists, sprint notes, guides) across `docs/` and `frontend/` root have been consolidated here and removed.
