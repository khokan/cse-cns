# Databases & Prisma Schema

The backend connects to **two separate databases** via **two separate Prisma clients**, both instantiated in `lib/prisma.ts` and exposed as `db.cns` and `db.cnsweb`.

## 1. `cns` Schema (SQL Server) — Core Business Data
Location: `backend/prisma/cns/`
```prisma
generator client {
  provider = "prisma-client"
  output   = "../../src/generated/cns"
}
datasource db {
  provider = "sqlserver"
}
```
Files: `schema.prisma`, `challan.prisma`, `settlement.prisma`, `taxToNBR.prisma`

Key models:
- **`Settlement`** — Trade settlement records (`TradeDate`, `ContractNumber` PK, buy/sell broker & trader codes, quantity, price, process type). Maps to legacy CNS trading data.
- **`Challan`** — Bank challan records related to tax remittance.
- **`TaxToNBR`** — Tax collection/remittance records sent to the National Board of Revenue (NBR), used by the tax certificate report.

This database is largely **read-heavy** and queried via raw SQL (`$queryRawUnsafe`) for reconciliation summaries and report builders (stored-procedure-like aggregation queries), since it maps to an existing legacy schema.

## 2. `cnsweb` Schema (PostgreSQL) — Application Data
Location: `backend/prisma/cnsweb/`
Files: `schema.prisma`, `auth.prisma`, `member.prisma`, `reportJob.prisma`, `auditLog.prisma`, plus `migrations/`

Key models:
- **`User`** — App users; `role` (ADMIN/TRECHOLDER), `trecHolderId` link, `status`, `emailVerified`, soft-delete fields (`isDeleted`, `deletedAt`). Relations: `accounts[]`, `sessions[]`, `reportJobs[]`.
- **`Session`** — better-auth session records (`token`, `expiresAt`, `ipAddress`, `userAgent`).
- **`Account`** — better-auth linked accounts/credentials (`providerId`, hashed `password`, OAuth `idToken`).
- **`Verification`** — OTP/email verification tokens (`identifier`, `value`, `expiresAt`).
- **`Member`** — TREC holder / member directory data used in member listing reports.
- **`ReportJob`** — Tracks async report generation: `reportType`, `format`, `filters` (JSON string), `status` (PENDING/PROCESSING/COMPLETED/FAILED), `queueJobId` (BullMQ correlation), `filePath`/`fileName`/`fileSize`, timestamps (`requestedAt`, `startedAt`, `completedAt`), `errorMessage`. Indexed on `userId`, `status`, `reportType`.
- **`AuditLog`** — Persisted audit trail for CRUD/administrative actions (see Logging document), written via `writeAuditLog()`.

## Prisma Client Generation
Each schema generates its own typed client under `backend/src/generated/<cns|cnsweb>`, imported and merged into a single `db` object (`db.cns.*`, `db.cnsweb.*`) so services can query either database with full type safety.

Config files: `prisma.cns.config.ts`, `prisma.cnsweb.config.ts`, `prisma.config.ts` define generator/datasource wiring per schema for the Prisma CLI.

## Stored-Procedure-Style Queries (Raw SQL)
Since `cns` maps to a legacy SQL Server schema, several read paths bypass the Prisma query builder in favor of raw parameterized SQL for performance and compatibility with existing views/procedures:
- `report.worker.ts` — `db.cns.$queryRawUnsafe<SpRawRow[]>(...)` for tax certificate source data
- `reconciliation.service.ts` — three raw queries: receivable summary, transaction summary, cash flow summary

These act as the equivalent of "stored procedure" calls — complex joins/aggregations executed directly against SQL Server and mapped into typed row interfaces (`SpRawRow`, `ReceivableSummaryRawRow`, `TransactionSummaryRawRow`, `CashFlowSummaryRawRow`).

## Migrations
Only the `cnsweb` (PostgreSQL/application) schema carries a `migrations/` folder, since `cns` (SQL Server) is treated as an existing, externally-managed legacy database (introspected/read-mostly rather than migrated by this app).

## BigInt/Serialization Handling
Since some legacy tables use `bigint` primary keys, `datatable.service.ts` explicitly serializes Prisma results through `JSON.stringify(..., (_, v) => typeof v === "bigint" ? v.toString() : v)` to make them JSON-safe for API responses.
