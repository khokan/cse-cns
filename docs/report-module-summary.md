# Report Module — Complete Implementation Summary

> **Project**: CSE-CNS Web Application  
> **Stack**: Next.js 14 (App Router) + Express.js + Prisma + TanStack Query v5  
> **Module location**: `backend/src/app/modules/reports/` · `frontend/src/`

---

## 1. End-to-End Lifecycle

```
User fills form  →  POST /api/v1/reports/request
     │
     ▼
ReportService.requestReport()
  ├─ Rate-limit check (max 5 active jobs per user)
  ├─ Creates ReportJob DB record  [status: PENDING]
  └─ enqueueReportJob() → p-queue

p-queue picks up job (concurrency = REPORT_QUEUE_CONCURRENCY, default 2)
     │
     ▼
processReportJob()  [report.worker.ts]
  ├─ DB update → [status: PROCESSING, startedAt: now]
  ├─ fetchData(reportType, filters)  →  Prisma query
  ├─ createBuilder(format, title)   →  XlsxBuilder | PdfBuilder | CsvBuilder
  ├─ builder.generate(data, filters) → Buffer
  ├─ storageLib.saveReport()        →  writes file to disk
  └─ DB update → [status: COMPLETED, filePath, fileSize, fileName, completedAt]
       or on error → [status: FAILED, errorMessage]

Frontend polls GET /api/v1/reports/jobs every 3 s (while any job is active)
     │
     ▼
User clicks "Download" → GET /api/v1/reports/download/:id
  ├─ Validates COMPLETED + file exists on disk
  └─ Streams file as attachment (Content-Disposition header)
```

---

## 2. Complete File Map

### Backend

| File | Purpose |
|---|---|
| `backend/prisma/cnsweb/reportJob.prisma` | Prisma model — database schema for `ReportJob` |
| `backend/src/app/modules/reports/report.interface.ts` | TypeScript types: `ReportStatus`, `ReportFormat`, `ReportType`, DTOs |
| `backend/src/app/modules/reports/report.route.ts` | Express router — 5 endpoints, all behind `checkAuth` middleware |
| `backend/src/app/modules/reports/report.controller.ts` | Thin controller layer — extracts req params, delegates to service |
| `backend/src/app/modules/reports/report.service.ts` | Business logic — rate-limit, DB CRUD, ownership checks |
| `backend/src/app/queues/report.queue.ts` | `p-queue` in-memory queue — configurable concurrency |
| `backend/src/app/workers/report.worker.ts` | Worker — fetches data, calls builder, saves file, updates DB |
| `backend/src/app/modules/reports/builders/base.builder.ts` | Abstract `ReportBuilder` class + `BuildResult` interface |
| `backend/src/app/modules/reports/builders/xlsx.builder.ts` | ExcelJS — styled workbook (title row, filter row, frozen header, zebra) |
| `backend/src/app/modules/reports/builders/pdf.builder.ts` | Puppeteer — renders HTML template → PDF buffer |
| `backend/src/app/modules/reports/builders/csv.builder.ts` | fast-csv — streams rows → Buffer |

### Frontend

| File | Purpose |
|---|---|
| `frontend/src/app/layout.tsx` | Root layout — wraps app in `ThemeProvider` + `QueryProviders` |
| `frontend/src/components/providers/Queryprovider.tsx` | Singleton `QueryClient` + `QueryClientProvider` |
| `frontend/src/app/(dashboardLayout)/reports/page.tsx` | "New Report" page — hosts `ReportRequestForm` |
| `frontend/src/app/(dashboardLayout)/reports/download-center/page.tsx` | "Download Center" page — hosts `DownloadCenter` |
| `frontend/src/components/modules/reports/ReportRequestForm.tsx` | Main form — type selector, contextual filters, submit |
| `frontend/src/components/modules/reports/ReportTypeSelector.tsx` | Card grid for report type + format button group |
| `frontend/src/components/modules/reports/DownloadCenter.tsx` | Paginated job list, status filter tabs, manual refresh |
| `frontend/src/components/modules/reports/JobProgressCard.tsx` | Per-job card — status icon, filter tags, download/cancel/retry |
| `frontend/src/components/modules/reports/JobStatusBadge.tsx` | Animated status badge with ping dot |
| `frontend/src/lib/hooks/useReportJobs.ts` | All TanStack Query hooks for the module |
| `frontend/src/services/report.service.ts` | Fetch wrappers — all API calls with cookie credentials |
| `frontend/src/constants/reportConstants.ts` | `REPORT_TYPE_CONFIGS`, `FORMAT_COLORS`, `STATUS_STYLES`, poll interval |

---

## 3. Database Schema

```prisma
model ReportJob {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(...)

  reportType   String    // "member_list" | "trec_holder_summary" | "user_activity" | "financial_summary"
  format       String    // "PDF" | "XLSX" | "CSV"
  filters      String?   // JSON-serialised filter params

  status       String    @default("PENDING")
  // PENDING → PROCESSING → COMPLETED | FAILED | CANCELLED

  queueJobId   String?   // UUID assigned at enqueue (for tracking)
  filePath     String?   // relative path under uploads/reports/
  fileSize     Int?      // bytes
  fileName     String?   // used as Content-Disposition filename

  errorMessage String?
  requestedAt  DateTime  @default(now())
  startedAt    DateTime?
  completedAt  DateTime?

  @@index([userId])
  @@index([status])
  @@index([reportType])
}
```

---

## 4. API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/reports/request` | All roles | Submit new report job |
| `GET` | `/api/v1/reports/jobs` | All roles | List jobs (paginated); ADMIN/IT pass `?all=true` |
| `GET` | `/api/v1/reports/jobs/:id` | All roles | Single job detail |
| `GET` | `/api/v1/reports/download/:id` | All roles | Stream completed file as attachment |
| `DELETE` | `/api/v1/reports/jobs/:id` | All roles | Cancel PENDING or PROCESSING job |

> **Ownership**: Non-admin users can only read/cancel/download their own jobs. Enforced in the service layer.

---

## 5. Report Types & Supported Formats

| Report Type | Label | Formats | Available Filters |
|---|---|---|---|
| `member_list` | Member Listing | PDF, XLSX, CSV | `memberCode`, `region` |
| `trec_holder_summary` | TrecHolder Summary | PDF, XLSX | `search` (name/email) |
| `user_activity` | User Activity Log | CSV, XLSX | `dateFrom`, `dateTo` |
| `financial_summary` | Financial Summary | PDF, XLSX | `region` |

---

## 6. Backend Implementation Details

### Service Layer (`report.service.ts`)

- **Rate limiting**: Max **5** concurrent active (`PENDING` + `PROCESSING`) jobs per user — throws `429 Too Many Requests` if exceeded.
- **Job creation**: Generates a `queueJobId` (UUID), creates the DB record, then calls `enqueueReportJob`.
- **Cancel**: Sets status to `CANCELLED`, cleans up the file from disk if it was already written during `PROCESSING`.
- **Download gate**: Validates `status === "COMPLETED"` and file exists on disk before streaming.

### Queue (`report.queue.ts`)

- Uses **`p-queue`** (in-process, no Redis required).
- Concurrency controlled via `REPORT_QUEUE_CONCURRENCY` env var (default: `2`).
- Design note: swappable with **BullMQ** when Redis is available — just replace `enqueueReportJob`.

### Worker (`report.worker.ts`)

Steps executed per job:

1. DB → `PROCESSING`, set `startedAt`
2. `fetchData(reportType, filters)` — Prisma query mapped to plain objects
3. `createBuilder(format, title)` — factory returns correct builder
4. `builder.generate(data, filters)` → `Buffer`
5. `storageLib.saveReport(userId, jobId, ext, buffer)` → `filePath`, `fileSize`
6. DB → `COMPLETED`, set `filePath`, `fileSize`, `fileName`, `completedAt`
7. On error → DB → `FAILED`, set `errorMessage`

#### Data Fetchers (inside worker)

| Function | Queries | Filterable by |
|---|---|---|
| `fetchMemberList` | `db.cnsWeb.member` | `memberCode`, `region` |
| `fetchTrecHolderSummary` | `db.cnsWeb.trecHolder` | `search` (name/email OR) |
| `fetchUserActivity` | `db.cnsWeb.session` (+ user join) | `userId`, `dateFrom`, `dateTo` (capped at 1000 rows) |
| `fetchFinancialSummary` | `db.cnsWeb.member` | `region` |

### Builder Pattern (`builders/`)

All builders extend `ReportBuilder` abstract class:

```typescript
abstract class ReportBuilder {
  abstract readonly title: string;
  abstract generate(
    data: Record<string, unknown>[],
    filters?: Record<string, unknown>
  ): Promise<BuildResult>;
}
```

| Builder | Library | Features |
|---|---|---|
| `XlsxBuilder` | **ExcelJS** | Title row (dark blue), filter row, styled column headers, zebra-stripe data rows, frozen pane, auto-column-width (max 50) |
| `PdfBuilder` | **Puppeteer** | Renders HTML → PDF; A4/landscape auto-select (>5 columns); branded gradient header; filter tags; page numbers in footer |
| `CsvBuilder` | **fast-csv** | Streams rows into Buffer; headers auto-derived from first row's keys |

---

## 7. Frontend Implementation Details

### React Query Provider Fix

`QueryProviders` (`Queryprovider.tsx`) was missing from the component tree, causing the `No QueryClient set` error on all report pages. Fixed by adding it to the root `layout.tsx`:

```tsx
// frontend/src/app/layout.tsx
<ThemeProvider>
  <QueryProviders>          {/* ← was missing */}
    <main>{children}</main>
    <Toaster richColors position="top-right" />
  </QueryProviders>
</ThemeProvider>
```

### React Query Hooks (`useReportJobs.ts`)

| Hook | Type | Key Feature |
|---|---|---|
| `useReportJobs(params?)` | `useQuery` | **Adaptive polling**: polls every 3 s while any job is `PENDING`/`PROCESSING`; stops automatically when all jobs reach terminal states |
| `useReportJob(id)` | `useQuery` | Per-job polling; auto-stops once job is terminal |
| `useRequestReport()` | `useMutation` | On success → `invalidateQueries(["report-jobs"])` to refresh list |
| `useCancelReportJob()` | `useMutation` | On success → `invalidateQueries(["report-jobs"])` |

### Frontend API Service (`report.service.ts`)

- All requests use `credentials: "include"` (cookie-based auth via `fetch`).
- Base URL comes from `NEXT_PUBLIC_API_BASE_URL` env var.
- `downloadReport(id)` creates a hidden `<a>` element and programmatically clicks it — the browser handles the file-save dialog natively using the `Content-Disposition: attachment` header from the server.

### UI Components

| Component | Key Behaviour |
|---|---|
| `ReportTypeSelector` | 2-column card grid; auto-switches format if the current one isn't supported by the newly selected report type |
| `ReportRequestForm` | Contextual filters rendered based on `REPORT_TYPE_CONFIGS` feature flags; toast on success → auto-navigates to Download Center |
| `DownloadCenter` | Status tab filters (`ALL`, `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`), pagination, live indicator pulsing dot while polling, skeleton loading, empty states |
| `JobProgressCard` | Animated blue top-bar while `PROCESSING`; shows filter pills, file size (KB), error message; context-aware action buttons (Download / Retry / Cancel) |
| `JobStatusBadge` | Animated ping dot for `PENDING` and `PROCESSING` states; colour-coded per status |

---

## 8. Status State Machine

```
                ┌─────────────┐
                │   PENDING   │──────────────────────────┐
                └──────┬──────┘                          │
                       │ queue picks up                  │ DELETE /jobs/:id
                       ▼                                 ▼
                ┌─────────────┐                  ┌───────────────┐
                │ PROCESSING  │─────────────────►│   CANCELLED   │
                └──────┬──────┘                  └───────────────┘
                       │
             ┌─────────┴──────────┐
             ▼                    ▼
      ┌────────────┐        ┌──────────┐
      │ COMPLETED  │        │  FAILED  │
      └────────────┘        └──────────┘
      (file ready)          (errorMessage set)
```

---

## 9. Role-Based Access

| Role | Request | View own jobs | Download own | View all jobs |
|---|---|---|---|---|
| `ADMIN` | ✅ | ✅ | ✅ | ✅ (`?all=true`) |
| `IT` | ✅ | ✅ | ✅ | ✅ (`?all=true`) |
| `ACCOUNTING` | ✅ | ✅ | ✅ | ❌ |
| `TRECHOLDER` | ✅ | ✅ | ✅ | ❌ |

---

## 10. Key Design Decisions

### In-memory Queue (p-queue)

No Redis or external broker is required. The queue exists only for the lifetime of the Node.js process. On server restart, any `PENDING`/`PROCESSING` jobs remain in the DB but won't be reprocessed automatically. A startup recovery sweep (query for orphaned jobs and re-enqueue them) can be added as a future improvement.

### Adaptive Polling

The `refetchInterval` callback in `useReportJobs` checks whether any job in the current page is non-terminal. If all are terminal, it returns `false`, stopping polling entirely and eliminating unnecessary network requests.

### Pluggable Builder Pattern

Adding a new output format (e.g., `ODS`, `DOCX`) requires:
1. A new class extending `ReportBuilder`
2. One new `case` in `createBuilder()` factory
3. Adding the format to the relevant `REPORT_TYPE_CONFIGS` entry

No other files need modification.

### PDF via Puppeteer

Puppeteer auto-downloads Chromium on first install. The `--no-sandbox` flag is already set for Linux/container compatibility. For Windows development, no extra configuration is needed.

### File Download Strategy

Rather than proxying file downloads through Next.js API routes, the frontend directly calls the Express backend download endpoint via a hidden `<a>` element. This avoids buffering the entire file in memory on the Next.js server and leverages the browser's native download handling.

---

## 11. Environment Variables

| Variable | Used in | Description |
|---|---|---|
| `REPORT_QUEUE_CONCURRENCY` | Backend | Max parallel report jobs (default: `2`) |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Base URL for all API calls (e.g. `http://localhost:5000/api/v1`) |
