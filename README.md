# CSE-CNS

A full-stack web application for CNS (Central Depository/Clearing) operations — member management, settlements, reconciliation, and tax report generation — built as a monorepo with a Next.js frontend and an Express/Prisma backend.

## Repository Structure
```
cse-cns/
  backend/     Express + TypeScript API, Prisma (dual DB), BullMQ workers, Socket.IO
  frontend/    Next.js (App Router) + TypeScript, TanStack Query/Table, better-auth client
  docs/        Consolidated project documentation (10 documents, see below)
  ai/          AI agent guidance docs (STACK, DOMAIN, ENGINEERING, PROJECT, PROMPT, UI, CLAUDE)
  utility/     Misc scripts/tools
```

## Tech Stack at a Glance
| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, TanStack Table |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (`cnsweb` — app data) + SQL Server (`cns` — legacy trading data), via Prisma |
| Auth | Better Auth (email/password, Google OAuth, Email OTP, Bearer tokens, session cookies) |
| Jobs/Queue | BullMQ + Redis (report & settlement generation) |
| Realtime | Socket.IO |
| Logging | Winston (structured logs + audit trail) |
| Monitoring | Sentry (frontend + backend) |
| Package Manager | pnpm (workspace) |

## Getting Started

### Prerequisites
- Node.js (LTS), pnpm
- PostgreSQL instance (for `cnsweb`) and access to a SQL Server instance (for `cns`)
- Redis instance (for BullMQ + caching)

### Install
```cmd
cd backend && pnpm install
cd ..\frontend && pnpm install
```

### Environment
Each app (`backend/.env`, `frontend/.env`) requires its own environment variables (database URLs, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `REDIS_URL`, `SENTRY_DSN`, Google OAuth credentials, etc.). See `backend/src/app/config/env.ts` for the full list of required backend variables.

### Run (development)
```cmd
cd backend && pnpm dev
cd ..\frontend && pnpm dev
```

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for app-specific instructions.

## Architecture Diagram
```mermaid
graph TB
    subgraph Client["Browser"]
        UI["Next.js App Router UI<br/>(TanStack Query/Table, better-auth client)"]
    end

    subgraph FE["Frontend (Next.js)"]
        APIRoutes["API Routes / BFF<br/>(e.g. /api/ui/logout)"]
        SocketClient["Socket.IO Client"]
        SentryFE["Sentry (browser)"]
    end

    subgraph BE["Backend (Express)"]
        Routes["Routes"]
        Middleware["Middleware<br/>(checkAuth, correlationId, validateRequest)"]
        Controllers["Controllers"]
        Services["Services"]
        BetterAuth["Better Auth<br/>(sessions, OAuth, OTP, Bearer)"]
        SocketServer["Socket.IO Server"]
        Logger["Winston Logger"]
        SentryBE["Sentry (Node)"]
    end

    subgraph Data["Data Layer"]
        Prisma["Prisma Clients"]
        PG[("PostgreSQL<br/>cnsweb: users, sessions,<br/>reportJob, auditLog, member")]
        MSSQL[("SQL Server<br/>cns: settlement, challan,<br/>taxToNBR (legacy)")]
    end

    subgraph Jobs["Background Jobs"]
        Redis[("Redis")]
        Queue["BullMQ Queues<br/>(report, settlement)"]
        Worker["BullMQ Workers<br/>(builders: CSV/XLSX/PDF)"]
        Storage["File Storage<br/>(generated reports)"]
    end

    UI -->|HTTPS fetch, credentials include| Routes
    UI --> APIRoutes
    UI <-->|realtime job status| SocketClient
    SocketClient <-->|websocket| SocketServer

    Routes --> Middleware --> Controllers --> Services
    Middleware --> BetterAuth
    Services --> Prisma
    Prisma --> PG
    Prisma --> MSSQL

    Services -->|enqueue| Queue
    Queue --> Redis
    Worker --> Redis
    Worker --> Prisma
    Worker --> Storage
    Worker -->|emit status| SocketServer
    Controllers -->|stream download| Storage

    Controllers --> Logger
    Services --> Logger
    Worker --> Logger
    Controllers --> SentryBE
    UI --> SentryFE
```

## Report Generation Workflow
```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Next.js Frontend
    participant API as Express API
    participant Q as BullMQ Queue (Redis)
    participant W as Report Worker
    participant DB as Prisma (cns / cnsweb)
    participant FS as File Storage
    participant WS as Socket.IO

    U->>FE: Request report (type, format, filters)
    FE->>API: POST /reports
    API->>DB: Create ReportJob (status=PENDING)
    API->>Q: enqueueReportJob(payload)
    API-->>FE: 202 Accepted { reportJobId }
    FE-->>U: Show "Generating..." + jobId

    Q->>W: Deliver job (report:type:jobId)
    W->>DB: Fetch source data (Prisma / raw SQL)
    W->>W: Build file (CSV / XLSX / PDF builder)
    W->>FS: Write generated file
    W->>DB: Update ReportJob (status=COMPLETED, filePath, fileName)
    W->>WS: emitToUser(userId, "report:status", {...})
    WS-->>FE: Realtime status push
    FE-->>U: Show "Ready" + Download button

    U->>FE: Click Download
    FE->>API: GET /reports/download/:id
    API->>DB: Validate access (getJobForDownload)
    API->>FS: createReportStream(filePath)
    FS-->>API: Readable stream
    API-->>U: Stream file (Content-Disposition: attachment)
```

## Authentication Workflow
```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Next.js (auth-client)
    participant API as Express (checkAuth)
    participant BA as Better Auth
    participant DB as PostgreSQL (cnsweb)

    U->>FE: Submit login (email/password or Google OAuth)
    FE->>API: better-auth request (credentials: include)
    API->>BA: Handle credential / OAuth / OTP flow
    BA->>DB: Verify User / Account, create Session
    BA-->>API: Set session cookie (HttpOnly)
    API-->>FE: 200 OK + Set-Cookie
    FE-->>U: Redirected to dashboard

    Note over U,API: Subsequent requests

    U->>FE: Navigate to protected page
    FE->>API: Request with session cookie
    API->>BA: auth.api.getSession(headers)
    BA->>DB: Validate Session token (hashed compare)
    BA-->>API: session.user { id, email, role }
    API->>API: checkAuth enforces role (authRoles)
    API-->>FE: Authorized response

    U->>FE: Logout
    FE->>BA: authClient.signOut()
    FE->>API: POST /api/ui/logout (fallback cookie clear)
    API-->>FE: Session invalidated, cookies cleared
```

## Documentation
All project documentation is consolidated into 10 documents under [`docs/`](docs):

| # | Document | Covers |
|---|---|---|
| 1 | `01-FRONTEND-OVERVIEW.md` | Frontend architecture, structure, hooks, services |
| 2 | `02-BACKEND-OVERVIEW.md` | Backend architecture, modules, middleware |
| 3 | `03-API-REFERENCE.md` | All REST API endpoints |
| 4 | `04-LOGGING-WINSTON.md` | Winston logging & audit trail |
| 5 | `05-SENTRY-MONITORING.md` | Sentry error monitoring (frontend + backend) |
| 6 | `06-DATABASE-PRISMA.md` | Prisma schemas, models, raw SQL queries |
| 7 | `07-GENERIC-TABLE-TANSTACK.md` | Generic CRUD table (TanStack Table) |
| 8 | `08-REPORT-ENGINE-BULLMQ.md` | Report engine, BullMQ, streaming downloads |
| 9 | `09-AUTH-BETTER-AUTH.md` | Better Auth, JWT, cookies, tokens |
| 10 | `10-IMPLEMENTATION-STATUS.md` | Final project implementation status |

## Core Features
- **Role-based access** (ADMIN / TRECHOLDER) enforced at both route and table level
- **Generic data management** — any registered Prisma model gets CRUD UI/API for free
- **Async report generation** — CSV/XLSX/PDF exports (member lists, tax certificates) via BullMQ workers, delivered as streamed downloads with realtime status via Socket.IO
- **Reconciliation dashboards** — receivable, transaction, and cash-flow summaries via raw SQL against the legacy `cns` database
- **Secure authentication** — session-based via Better Auth, with OAuth and OTP support

## License
Internal/proprietary project.
