# CSE-CNS Frontend

Next.js (App Router) + TypeScript frontend for the CSE-CNS platform: authentication UI, generic data management tables, report generation UI, settlement/reconciliation dashboards.

> For full architectural detail, see [`../docs/01-FRONTEND-OVERVIEW.md`](../docs/01-FRONTEND-OVERVIEW.md), [`../docs/07-GENERIC-TABLE-TANSTACK.md`](../docs/07-GENERIC-TABLE-TANSTACK.md), [`../docs/08-REPORT-ENGINE-BULLMQ.md`](../docs/08-REPORT-ENGINE-BULLMQ.md), and [`../docs/09-AUTH-BETTER-AUTH.md`](../docs/09-AUTH-BETTER-AUTH.md).

## Stack
- Next.js (App Router), React, TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query (server state) + TanStack Table (data grids)
- `better-auth/react` (auth client)
- Socket.IO client (realtime job status)
- Sentry (browser monitoring) + Web Vitals

## Directory Structure
```
src/
  actions/       Server actions
  app/           App Router routes: (auth), (dashboardLayout), api, debug
  components/
    modules/     Feature components (admin, datatable, reports, settlement, Auth, login, dashboard)
    providers/   App-wide providers (query client, theme, sentry)
    shared/      Layout components (navbar, footer, error-boundary, logout-button)
    ui/          shadcn/ui primitives
  constants/     Static config (reportConstants, roles)
  hooks/         useDatatable, useBulkActions, useReconciliation, useReportJobs, useJobStatus, useSentryInit, useWebVitals
  lib/           api-client, auth-client, socket, error helpers
  services/      Typed API service wrappers (admin, datatable, reconciliation, report, settlement, trecholder, user)
  types/         Shared TypeScript types
  utils/         Utility helpers (tanstack-table-helpers, etc.)
  zod/           Validation schemas
```

## Prerequisites
- Node.js (LTS)
- pnpm
- Running backend API (see `../backend/README.md`)

## Setup
```cmd
pnpm install
```

Configure `.env` with (at minimum):
```
NEXT_PUBLIC_BASE_URL=http://localhost:5000
NEXT_PUBLIC_SENTRY_DSN=...
```

## Run
```cmd
pnpm dev        REM start dev server (http://localhost:3000)
pnpm build      REM production build (also runs Sentry source-map upload via sentry.config.ts)
pnpm start      REM run production build
pnpm lint       REM ESLint
```

## Key Concepts
- **Auth:** `lib/auth-client.ts` uses `credentials: "include"` so session cookies are sent to the backend. Use `signOutUser()` for logout (clears session + calls `/api/ui/logout` fallback).
- **Generic Data Table:** `components/modules/datatable/GenericDataTable.tsx` + `hooks/useDatatable.ts` render CRUD UI for any backend-registered table without custom per-table code.
- **Reports:** `hooks/useReportJobs.ts` creates/lists report jobs; `hooks/useJobStatus.ts` subscribes to realtime Socket.IO status updates; downloads link directly to the backend's streaming endpoint.
- **Monitoring:** `hooks/useSentryInit.ts` initializes Sentry on the client; errors also surface through `app/error.tsx`, `app/global-error.tsx`, and `components/shared/error-boundary.tsx`.

## Notes
- Uses pnpm workspaces (`pnpm-workspace.yaml`) alongside the backend.
- `components.json` configures shadcn/ui component generation conventions.

## Architecture Diagram
```mermaid
graph TB
    subgraph Browser
        Pages["App Router Pages<br/>(auth), (dashboardLayout)"]
        Providers["Providers<br/>(Query Client, Theme, Sentry)"]
        Components["Feature Components<br/>(datatable, reports, settlement, Auth)"]
        Hooks["Hooks<br/>(useDatatable, useReportJobs, useJobStatus, useReconciliation)"]
        Services["Services<br/>(*.service.ts)"]
        ApiClient["lib/api-client.ts"]
        AuthClient["lib/auth-client.ts (better-auth/react)"]
        SocketClient["lib/socket.ts (Socket.IO client)"]
        Sentry["useSentryInit.ts"]
    end

    subgraph NextServer["Next.js Server"]
        ApiRoutes["app/api/* Route Handlers<br/>(BFF, e.g. /api/ui/logout)"]
        ServerActions["actions/*.action.ts"]
    end

    Backend["Express Backend API"]

    Pages --> Providers --> Components
    Components --> Hooks --> Services --> ApiClient
    Components --> ServerActions
    ApiClient -->|credentials: include| Backend
    AuthClient -->|session cookie| Backend
    SocketClient <-->|websocket, job status| Backend
    Components --> ApiRoutes --> Backend
    Components --> Sentry
```

## Data Fetching & CRUD Workflow (Generic Table)
```mermaid
sequenceDiagram
    participant U as User
    participant C as GenericDataTable
    participant H as useDatatable hooks
    participant S as datatable.service.ts
    participant API as Backend /data API

    U->>C: Select table
    C->>H: useAccessibleTables()
    H->>S: getAccessibleTables()
    S->>API: GET /data/tables
    API-->>S: [{ key, canWrite, primaryKey }]
    S-->>H: tables list
    H-->>C: Render table selector

    U->>C: View rows (page/search/sort)
    C->>H: useDatatableRows(table, params)
    H->>S: listRows(table, params)
    S->>API: GET /data/:table?page&search&sortBy
    API-->>S: { data, meta }
    S-->>C: Rows rendered via TanStack Table

    U->>C: Create/Edit/Delete row
    C->>H: useCreateRow / useUpdateRow / useDeleteRow
    H->>S: createRow / updateRow / deleteRow
    S->>API: POST/PATCH/DELETE /data/:table[/:id]
    API-->>S: Updated row / success
    H->>H: invalidateQueries(["datatable","rows",table])
    H-->>C: Toast success + refreshed rows
```

## Report Download Workflow
```mermaid
sequenceDiagram
    participant U as User
    participant RJ as useReportJobs
    participant JS as useJobStatus (Socket.IO)
    participant API as Backend

    U->>RJ: Create report (type, format, filters)
    RJ->>API: POST /reports
    API-->>RJ: { reportJobId, status: PENDING }
    RJ-->>U: Show job in "processing" list

    API-->>JS: emit "report:status" (via Socket.IO)
    JS-->>U: Update UI in realtime (status: COMPLETED)

    U->>API: GET /reports/download/:id (browser navigation)
    API-->>U: Streamed file (Content-Disposition: attachment)
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
