# CSE-CNS Full-Stack Architecture — Implementation Plan (v3)

## Architectural Schema Updates (from user input)

### 1. CNS DB: Settlement / Trade Schema (`prisma/cns/settlement.prisma`)
```prisma
model Settlement {
  TradeDate      DateTime? @db.DateTime
  ContractNumber String    @db.VarChar(50)
  ScripID        String?   @db.VarChar(50)
  BuyBrokerCode  String?   @db.VarChar(50)
  BuyTraderCode  String?   @db.VarChar(50)
  BuyOrdType     String?   @db.VarChar(10)
  SellBrokerCode String?   @db.VarChar(50)
  SellTraderCode String?   @db.VarChar(50)
  SellOrdType    String?   @db.VarChar(10)
  Quantity       Int?
  Price          Decimal?  @db.Decimal(38, 4)
  ProcessType    String?   @db.VarChar(10)
  TradeTime      String?   @db.VarChar(50)

  @@id([ContractNumber, TradeDate], map: "PK_Settlement")
}
```

### 2. CNS DB: Challan Schema (`prisma/cns/challan.prisma`)
```prisma
model Challan {
  ID                     BigInt    @id(map: "PK_Challan") @default(autoincrement())
  ChallanNumber          String?   @db.VarChar(100)
  ChallanDate            DateTime? @db.DateTime
  ChallanPeriodStartDate DateTime? @db.DateTime
  ChallanPeriodEndDate   DateTime? @db.DateTime
  TotalTaxAmount         Decimal?  @db.Decimal(38, 2)
}
```

---

## Overview of System Components

```
                    Next.js Frontend
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
 Settlement UI                         Reports UI / CRUD UI
         │                                   │
         └─────────────────┬─────────────────┘
                           │
                     Express API Gateway
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
 Settlement API       Report API        Admin & DataTable API
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                        BullMQ (Reports & Settlement)
                           │
        ┌──────────────────┼───────────────────────────────┐
        │                  │                               │
 Settlement Queue     Report Queue                 Notification Queue (Phase 10)
        │                  │                               │
        ▼                  ▼                               ▼
 Settlement Worker    Report Worker                Email/WebSocket
        │                  │
        │                  ├──────────────┐
        │                  │              │
        │             Puppeteer       ExcelJS / fast-csv
        │                  │              │
        └──────────────┬───┴──────────────┘
                       │
                  SQL Server (CNS + CNSWeb)
                       │
                Redis Cache (Report Jobs only)
                       │
                File Storage
```

---

## Key Modules & Roles

1. **Settlement Module**: Triggered synchronously / enqueued by **IT** role. Works on CNS DB Settlement/Trade records.
2. **DataTable CRUD Module**: Synchronous CRUD operations (no BullMQ) for any table in `CNS` or `CNSWeb` registered in `datatable.registry.ts` (e.g. `Challan`, `TaxToNBR`, `Member`, `TrecHolder`).
3. **Audit Log Module**: Asynchronous fire-and-forget logging for all create, update, delete, settlement, and auth actions into `CNSWeb.AuditLog`.
4. **Reports Module**: Async via BullMQ (`reportQueue`), file generation using Puppeteer/ExcelJS/fast-csv, cached with Redis (`reportCache`).
5. **Notification Queue**: Deferred to Phase 10 (Last Phase).

---

## Detailed Step-by-Step Execution Sequence

### Phase 1: Dependency & Infra Setup
- Install `bullmq`, `ioredis`, `socket.io`, `@socket.io/redis-adapter` in `backend`.
- Add `REDIS_URL` to `.env` & `env.ts`.
- Setup Redis client helper (`src/app/lib/redis.ts`) for Report Cache.
- Setup Socket.IO server (`src/app/lib/socket.ts`).

### Phase 2: Schemas & Audit Logging
- Create `prisma/cnsweb/auditLog.prisma`.
- Create `prisma/cns/settlement.prisma` and `prisma/cns/challan.prisma`.
- Run `pnpm generate:cnsweb` and `pnpm generate:cns`.
- Build `src/app/utils/auditLog.ts`.

### Phase 3: Queues & Workers (Report + Settlement)
- Upgrade `report.queue.ts` & `report.worker.ts` to BullMQ.
- Create `settlement.queue.ts` & `settlement.worker.ts`.
- Connect WebSocket events (`report:status`, `settlement:status`).

### Phase 4: Backend Module Implementation
- Implement **Settlement** Module (Interface, Service, Controller, Route). Restricted trigger to `UserRole.IT` & `UserRole.ADMIN`.
- Implement **DataTable CRUD** Module (Registry, Interface, Service, Controller, Route). Includes `Challan`, `TaxToNBR`, `Member`, `TrecHolder`.
- Implement **Admin** Module (User management & Audit Log viewer).
- Mount routes in `src/app/routes/index.ts`.
- Attach Socket & Workers in `src/server.ts`.

### Phase 5: Frontend Integration
- Add services & types (`settlement.service.ts`, `datatable.service.ts`, `admin.service.ts`).
- Setup Socket.IO client (`lib/socket.ts`) and hook (`hooks/useJobStatus.ts`).
- Build UI pages: `/settlements`, `/data`, `/data/[table]`, `/admin`.
- Build UI components: `SettlementTable`, `CreateSettlementForm`, `GenericDataTable`, `RowCreateEditDialog`.

### Phase 6: Verification & Validation
- Compile backend (`pnpm build`).
- Verify Prisma generated clients.
- Verify API endpoints and CRUD capabilities.

### Phase 10: Notification Queue (Deferred)
- Setup `notification.queue.ts` & `notification.worker.ts` for Email/WebSocket alerts.
