# Backend Overview

## Stack
- **Runtime/Framework:** Node.js + Express + TypeScript
- **ORM:** Prisma (two separate schemas/clients — `cns` and `cnsweb`, see DB document)
- **Auth:** better-auth (with Prisma adapter), JWT utilities, Bearer + Email OTP plugins
- **Queue/Jobs:** BullMQ backed by Redis (ioredis)
- **Realtime:** Socket.IO server for pushing job status to connected clients
- **Logging:** Winston
- **Monitoring:** Sentry (Node SDK)
- **File storage:** Local/streamed file storage (`lib/storage.ts`) for generated reports and uploads

## Directory Structure (`backend/src/app`)
```
app.ts / server.ts     Express app bootstrap & HTTP server entry
config/                 env.ts — centralized environment variable loading/validation
errorHelpers/           AppError and error utilities
interfaces/             Shared TS interfaces
lib/                    auth.ts, prisma.ts, redis.ts, sentry.ts, socket.ts, storage.ts
middleware/             checkAuth, correlationId, globalErrorHandler, notFound, validateRequest
modules/                Feature modules (admin, auth, datatable, reconciliation, reports, settlement)
queues/                 BullMQ Queue definitions (report.queue.ts, settlement.queue.ts)
routes/                 index.ts — central route mounting
shared/                 catchAsync.ts, sendResponse.ts — response/error wrapper helpers
types/                  Shared domain types (e.g. auth.types.ts)
utils/                  logger.ts, jwt.ts, cookie.ts, auditLog.ts, email.ts, QueryBuilder.ts, seed.ts
workers/                BullMQ worker processes (report.worker.ts, settlement.worker.ts)
generated/              Prisma-generated clients (cns, cnsweb)
```

## Module Pattern
Each feature module under `modules/<name>` follows a consistent structure:
- `*.route.ts` — Express router, wires middleware (auth, validation) to controller
- `*.controller.ts` — Thin HTTP layer using `catchAsync` + `sendResponse`
- `*.service.ts` — Business logic, Prisma queries, raw SQL calls to stored procedures
- `*.interface.ts` — TypeScript types/DTOs for the module

Modules: `admin`, `auth`, `challan` (**[NEW]** Full CRUD with date conversion and form validation), `datatable` (generic CRUD registry), `reconciliation`, `reports` (with a `builders/` subfolder for CSV/XLSX/PDF generation), `settlement`, `taxToNBR` (**[NEW]** Full CRUD for tax-to-NBR records with proper DateTime handling).

## Cross-Cutting Middleware
- `checkAuth.ts` — validates session via `better-auth`'s `auth.api.getSession()`, attaches `req.user`, enforces role-based access
- `correlationId.ts` — assigns a request correlation ID for tracing across logs
- `validateRequest.ts` — Zod-based request validation
- `globalErrorHandler.ts` / `notFound.ts` — centralized error responses

## Core Libraries (`lib/`)
- `auth.ts` — better-auth configuration (see Auth document)
- `prisma.ts` — instantiates `db.cns` and `db.cnsweb` Prisma clients
- `redis.ts` — general-purpose Redis client + dedicated BullMQ Redis connection with reconnect/retry strategy
- `sentry.ts` — Sentry init/capture wrapper
- `socket.ts` — Socket.IO server setup, `emitToUser()` for targeted realtime events
- `storage.ts` — file read/write/stream helpers for generated reports

**[NEW]** Date Conversion Best Practice: Services handling date inputs (e.g., `challan.service.ts`, `taxToNBR.service.ts`) now convert date strings to proper Date objects before passing to Prisma to avoid DateTime validation errors. Pattern: `dto.fieldDate ? new Date(dto.fieldDate) : null`

## Request Flow
`server.ts` → `app.ts` (Express app, global middleware, correlationId, logger) → `routes/index.ts` mounts:
`/auth`, `/reports`, `/settlements`, `/data` (datatable), `/admin`, `/reconciliation` → controller → service → Prisma/Redis/BullMQ.

## Background Processing
Report and settlement generation are offloaded to BullMQ queues/workers (see Report Engine document) so HTTP requests return immediately with a job reference, and results are pushed via Socket.IO plus polling.

## Notable Root-Level Docs (docs/)
Legacy planning/audit docs (`ARCHITECTURE.md`, `AUDIT_*`, `sprint-1.md`, `sprint-2.md`, `dashboard-plan.md`, `FILE_STRUCTURE.md`, etc.) have been consolidated into this 10-document summary set and removed from the repository to avoid documentation drift.
