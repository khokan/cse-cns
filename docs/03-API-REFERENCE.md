# API Reference

Base path is mounted at the Express app root (e.g. `/api/v1`) via `routes/index.ts`. All routes below are relative to that base.

## Auth — `/auth` (`modules/auth`)
Wraps better-auth session/credential flows plus custom endpoints (registration, role/status checks). Uses `emailAndPassword`, Google OAuth (`socialProviders`), and Email OTP verification. Session cookie/bearer token issued by better-auth; see Auth document for details.

## Reports — `/reports` (`modules/reports`)
| Method | Path | Description |
|---|---|---|
| POST | `/reports` | Create a report generation job (enqueues to BullMQ `report-queue`) |
| GET | `/reports` | List report jobs for current user (or all, for admin) |
| GET | `/reports/:id` | Get job status/detail |
| GET | `/reports/download/:id` | **Stream** the generated report file as an attachment (`Content-Disposition`, mime-type resolved from extension) |

Report types include `member_list` and `trec_holder_tax_certificate`, each with CSV/XLSX/PDF builders.

## Settlements — `/settlements` (`modules/settlement`)
Manages settlement report/job creation and status, backed by `settlement.queue.ts` / `settlement.worker.ts`, mirroring the report job pattern for settlement data exports.

## Data (Generic CRUD) — `/data` (`modules/datatable`)
| Method | Path | Description |
|---|---|---|
| GET | `/data/tables` | List tables accessible to the current user's role (`getAccessibleTables`) |
| GET | `/data/:table` | Paginated, searchable, sortable list of rows (`listRows`) |
| GET | `/data/:table/:id` | Get a single row |
| POST | `/data/:table` | Create a row (role-gated by `writeRoles`) |
| PATCH/PUT | `/data/:table/:id` | Update a row |
| DELETE | `/data/:table/:id` | Delete a row |

Driven by `datatable.registry.ts`, which maps table keys to Prisma db/model, primary key, `readRoles`/`writeRoles`, `idType`, and searchable fields — enabling one generic controller/service to serve many tables.

## Admin — `/admin` (`modules/admin`)
User management, bulk operations, and administrative actions (role changes, activation/deactivation, audit-log-triggering operations).

## Reconciliation — `/reconciliation` (`modules/reconciliation`)
Read-heavy endpoints executing raw SQL (`$queryRawUnsafe`) against the `cns` (SQL Server) database for summaries:
- Receivable summary
- Transaction summary
- Cash flow summary

## Common Response Shape
All controllers use `catchAsync` (error-forwarding wrapper) and `sendResponse` (shared success envelope: `{ success, statusCode, message, data }`), with errors funneled through `globalErrorHandler` returning a consistent error JSON shape including `correlationId`.

## Realtime Channel (not REST, but API-adjacent)
Socket.IO events pushed from the backend (`lib/socket.ts`, `emitToUser`):
- `report:status` — report job progress/completion
- `settlement:status` — settlement job progress/completion

Frontend consumes these via `useJobStatus.ts` in addition to polling (`useReportJobs.ts`).
