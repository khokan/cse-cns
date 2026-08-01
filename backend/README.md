# CSE-CNS Backend

Express + TypeScript API server powering the CSE-CNS platform: authentication, generic data CRUD, report/settlement generation, and reconciliation reporting.

> For full architectural detail, see [`../docs/02-BACKEND-OVERVIEW.md`](../docs/02-BACKEND-OVERVIEW.md), [`../docs/03-API-REFERENCE.md`](../docs/03-API-REFERENCE.md), [`../docs/06-DATABASE-PRISMA.md`](../docs/06-DATABASE-PRISMA.md), [`../docs/08-REPORT-ENGINE-BULLMQ.md`](../docs/08-REPORT-ENGINE-BULLMQ.md), and [`../docs/09-AUTH-BETTER-AUTH.md`](../docs/09-AUTH-BETTER-AUTH.md).

## Stack
- Node.js + Express + TypeScript
- Prisma (dual clients: `cns` on SQL Server, `cnsweb` on PostgreSQL)
- Better Auth (email/password, Google OAuth, Email OTP, Bearer)
- BullMQ + Redis (background jobs for reports/settlements)
- Socket.IO (realtime job status)
- Winston (logging) + Sentry (monitoring)

## Directory Structure
```
src/
  app.ts / server.ts   Express app bootstrap & server entry
  config/               env.ts - environment variable loading
  errorHelpers/         AppError and error utilities
  lib/                  auth, prisma, redis, sentry, socket, storage
  middleware/           checkAuth, correlationId, globalErrorHandler, notFound, validateRequest
  modules/              admin, auth, datatable, reconciliation, reports, settlement
  queues/               BullMQ Queue definitions
  workers/              BullMQ worker processes
  routes/               central route mounting
  shared/               catchAsync, sendResponse
  utils/                logger, jwt, cookie, auditLog, email, QueryBuilder, seed
  generated/             Prisma-generated clients (cns, cnsweb)
prisma/
  cns/                  Legacy SQL Server schema (settlement, challan, taxToNBR)
  cnsweb/               Application PostgreSQL schema (auth, member, reportJob, auditLog) + migrations
```

## Prerequisites
- Node.js (LTS)
- pnpm
- PostgreSQL (for `cnsweb`)
- Access to SQL Server (for `cns`, legacy/introspected)
- Redis (BullMQ + caching)

## Setup
```cmd
pnpm install
```

Configure `.env` with (at minimum):
```
DATABASE_URL=...            # cnsweb (PostgreSQL)
CNS_DATABASE_URL=...        # cns (SQL Server)
REDIS_URL=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SENTRY_DSN=...
NODE_ENV=development
```
See `src/app/config/env.ts` for the authoritative list.

## Database
Generate Prisma clients and run migrations for the `cnsweb` schema:
```cmd
pnpm exec prisma generate --config prisma.cnsweb.config.ts
pnpm exec prisma migrate dev --config prisma.cnsweb.config.ts
pnpm exec prisma generate --config prisma.cns.config.ts
```
The `cns` (SQL Server) schema is treated as an existing legacy database — no migrations are applied against it, only introspection/read/raw-query access.

## Run
```cmd
pnpm dev        REM start API server in watch mode
pnpm build      REM compile TypeScript
pnpm start      REM run compiled build
```

Background workers (report/settlement generation) run as part of the same process tree via `workers/report.worker.ts` and `workers/settlement.worker.ts` — ensure Redis is reachable before starting.

## Key Concepts
- **Generic CRUD:** New tables are exposed via `modules/datatable/datatable.registry.ts` — no new route/controller needed.
- **Auth:** Session cookies verified via `better-auth`'s `auth.api.getSession()` in `checkAuth` middleware; role-based route guards via `checkAuth(...roles)`.
- **Reports:** POST to `/reports` enqueues a BullMQ job; poll or subscribe via Socket.IO for status; download via `GET /reports/download/:id` (streamed).
- **Logging:** Use the shared `logger` from `utils/logger.ts` (Winston) instead of `console.log`.

## Logs
Written to `logs/error.log` and `logs/combined.log` at the project root.

## Architecture Diagram
```mermaid
graph TB
    Client["Frontend / API Consumer"]

    subgraph Express["Express App (app.ts / server.ts)"]
        Router["routes/index.ts"]
        MW["Middleware<br/>correlationId, checkAuth, validateRequest"]
        subgraph Modules
            Auth["auth"]
            Reports["reports (+ builders/)"]
            Settlement["settlement"]
            Datatable["datatable (registry-driven)"]
            Admin["admin"]
            Reconciliation["reconciliation"]
        end
        Shared["shared: catchAsync, sendResponse"]
        ErrHandler["globalErrorHandler / notFound"]
    end

    subgraph Libs["lib/"]
        AuthLib["auth.ts (better-auth)"]
        PrismaLib["prisma.ts (db.cns, db.cnsweb)"]
        RedisLib["redis.ts"]
        SocketLib["socket.ts"]
        StorageLib["storage.ts"]
        SentryLib["sentry.ts"]
    end

    subgraph Async["Background Processing"]
        Queues["queues/ (BullMQ)"]
        Workers["workers/ (report, settlement)"]
    end

    subgraph DataStores["Data Stores"]
        PG[("PostgreSQL - cnsweb")]
        MSSQL[("SQL Server - cns")]
        Redis[("Redis")]
        Disk[("File Storage")]
    end

    Client -->|HTTP| Router --> MW --> Modules
    Modules --> Shared
    Modules --> ErrHandler
    MW --> AuthLib --> PG
    Modules --> PrismaLib --> PG
    PrismaLib --> MSSQL
    Modules -->|enqueue| Queues --> Redis
    Workers --> Redis
    Workers --> PrismaLib
    Workers --> StorageLib --> Disk
    Workers -->|emit| SocketLib -->|websocket| Client
    Modules -->|stream| StorageLib
    Modules --> SentryLib
    RedisLib --> Redis
```

## Request Lifecycle (Generic CRUD Example)
```mermaid
sequenceDiagram
    participant C as Client
    participant R as Router
    participant MW as checkAuth Middleware
    participant Ctrl as datatable.controller
    participant Svc as datatable.service
    participant Reg as datatable.registry
    participant P as Prisma (db.cns / db.cnsweb)
    participant Audit as auditLog

    C->>R: GET/POST /data/:table
    R->>MW: Verify session (better-auth getSession)
    MW-->>R: req.user { userId, role }
    R->>Ctrl: Route to controller
    Ctrl->>Svc: listRows / createRow / updateRow / deleteRow
    Svc->>Reg: getTableConfig(tableKey)
    Reg-->>Svc: { db, model, readRoles, writeRoles, primaryKey }
    Svc->>Svc: Enforce role check
    Svc->>P: findMany / create / update / delete
    P-->>Svc: Result rows (BigInt-safe serialized)
    Svc->>Audit: writeAuditLog (on write ops)
    Svc-->>Ctrl: Data + meta
    Ctrl-->>C: sendResponse({ success, data })
```

## Report Job Lifecycle
```mermaid
sequenceDiagram
    participant Ctrl as report.controller
    participant Svc as report.service
    participant Q as report.queue (BullMQ)
    participant W as report.worker
    participant B as Builder (CSV/XLSX/PDF)
    participant DB as Prisma
    participant FS as storage.ts
    participant WS as socket.ts

    Ctrl->>Svc: createReportJob(payload)
    Svc->>DB: Create ReportJob (status=PENDING)
    Svc->>Q: enqueueReportJob(payload)
    Q-->>Ctrl: 202 { reportJobId }

    Q->>W: Job delivered (report:type:jobId)
    W->>DB: fetchMemberList / fetchUserActivity / $queryRawUnsafe
    W->>B: build(data, format)
    B-->>W: Buffer / file stream
    W->>FS: write report file
    W->>DB: update ReportJob (COMPLETED, filePath, fileName)
    W->>WS: emitToUser(userId, "report:status")

    Note over Ctrl,FS: Later — download request
    Ctrl->>Svc: getJobForDownload(id, userId, role)
    Svc->>DB: validate ownership/role
    Ctrl->>FS: createReportStream(filePath)
    FS-->>Ctrl: Readable stream
    Ctrl-->>Ctrl: stream.pipe(res) [attachment]
```
