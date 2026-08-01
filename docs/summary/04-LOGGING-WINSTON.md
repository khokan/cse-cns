# Logging (Winston) & Monitoring Fundamentals

## Backend Logging — Winston
Location: `backend/src/app/utils/logger.ts`

- **Level:** `debug` in development, `info` in production (`envVars.NODE_ENV`)
- **Format:** `timestamp` (`YYYY-MM-DD HH:mm:ss`) + `errors({ stack: true })` + `json()`
- **Transports:**
  - `Console` — colorized human-readable output in dev, JSON in production
  - `File` — `logs/error.log` (level: `error` only)
  - `File` — `logs/combined.log` (all levels)
- **Request logging middleware:** `requestLogger` (exported alongside `logger`) hooks into `res.on("finish")` to log method, path, status code, duration, and `correlationId` for every HTTP request.

### Usage Pattern
Modules import the default `logger` export (e.g. `report.worker.ts`, `redis.ts`) and call `logger.info/warn/error(...)` instead of raw `console.log`, giving structured, greppable logs with metadata objects.

### Correlation IDs
`middleware/correlationId.ts` assigns a unique ID per request (propagated via header/`req` property), attached to every log line so a single request can be traced across async operations (including BullMQ job logs).

### Log Files
Physical logs are written under `backend/logs/` (`error.log`, `combined.log`), rotated/managed at the OS/deployment level (daily-rotate-file package referenced in planning docs for production hardening).

## Frontend Logging
The frontend does not run Winston (browser context); instead:
- Client-side errors are captured via Sentry (`useSentryInit.ts`) rather than a file logger.
- `console.log`/`console.error` remain for local dev debugging (e.g. `useJobStatus.ts` socket event logs).

## Audit Logging (distinct from Winston)
`utils/auditLog.ts` (`writeAuditLog`) persists business-level audit trail entries (who did what, on which entity) to the database — used by `datatable.service.ts` on create/update/delete operations. This is separate from Winston's operational/application logs; audit logs are queryable data records (`auditLog.prisma`), while Winston logs are files/console streams for observability.

## Summary of Layers
| Layer | Tool | Purpose |
|---|---|---|
| Operational/app logs | Winston | Debugging, request tracing, error files |
| Error monitoring | Sentry | Exception aggregation, alerting (see dedicated Sentry doc) |
| Business audit trail | `auditLog` table via `writeAuditLog` | Compliance/traceability of CRUD actions |
