# CSE-CNS Report Generation Engine — PRD

> **Version:** 1.1 · **Status:** Approved — Implementation in Progress  
> **Stack alignment:** Express 5 + Prisma 7 (MSSQL) backend · Next.js 16 + TanStack Query v5 + Tailwind v4 frontend

> [!IMPORTANT]
> **Confirmed decisions:** No Redis → `p-queue` (in-memory, swappable to BullMQ+Redis later). Storage → Local disk (`uploads/reports/`). Deployment → Windows Server (Puppeteer auto-downloads Chromium).

---

## 1. Executive Summary

The Report Generation Engine allows authorised users (ADMIN / TRECHOLDER roles) to request, track, and download structured reports in **PDF**, **XLSX**, and **CSV** formats. Reports are generated **asynchronously** via a background job queue so the UI stays responsive. All generated files are stored on an **FTP server** and users access them from a dedicated **Download Center** page.

---

## 2. Goals & Non-Goals

### Goals
- Async report generation with real-time status polling (no page freezes)
- Support for PDF, XLSX, and CSV output per report type
- Role-based access — only authorised users see and generate their reports
- Download Center page showing job history with statuses
- Retry/cancel logic for failed jobs
- FTP-based file storage (not Cloudinary — reserved for images)

### Non-Goals (v1)
- Scheduled/recurring auto-reports (can be added via `node-cron` in v2)
- Email delivery of reports (v2)
- Report preview in-browser (v2, Puppeteer iframe)
- Real-time WebSocket push (polling with React Query is sufficient for v1)

---

## 3. User Roles & Permissions

| Role | Can Request Reports | Can View Own Jobs | Can View All Jobs | Can Cancel Jobs |
|---|---|---|---|---|
| `ADMIN` | ✅ All report types | ✅ | ✅ | ✅ |
| `TRECHOLDER` | ✅ Own-data reports only | ✅ | ❌ | ✅ Own only |
| `IT` | ✅ All report types | ✅ | ✅ | ✅ |
| `ACCOUNTING` | ✅ Financial reports | ✅ | ❌ | ✅ Own only |

Auth is validated by the existing `checkAuth` middleware that reads the `better-auth.session_token` + custom JWT combo.

---

## 4. Report Types (v1 Scope)

| Report ID | Name | Primary Data Source | Formats |
|---|---|---|---|
| `member_list` | Member Listing | `Member` (cns DB) | PDF, XLSX, CSV |
| `trec_holder_summary` | TrecHolder Summary | `TrecHolder` (cnsweb DB) | PDF, XLSX |
| `user_activity` | User Activity Log | `User`, `Session` (cnsweb DB) | CSV, XLSX |
| `financial_summary` | Financial Summary | `Member`.AccountCode + custom SQL | PDF, XLSX |

> **Note:** New report types are added by registering a new `ReportBuilder` class — no other changes needed (open/closed principle).

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│                                                             │
│   [Report Filter Page]  ──POST─→  /api/v1/reports/request  │
│   [Download Center]     ──GET──→  /api/v1/reports/jobs      │
│   TanStack Query polls  ──GET──→  /api/v1/reports/jobs/:id  │
│   Download link         ──GET──→  /api/v1/reports/download/:id │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP (axios, existing proxy)
┌────────────────────────────▼────────────────────────────────┐
│                    Express 5 Backend                         │
│                                                             │
│   ReportController  →  ReportService  →  BullMQ Queue       │
│                                              │               │
│                                    ┌─────────▼──────────┐   │
│                                    │   Report Worker     │   │
│                                    │  (BullMQ process)   │   │
│                                    │                     │   │
│                                    │  ReportBuilder      │   │
│                                    │  ├─ PdfBuilder      │   │
│                                    │  │  (Puppeteer)     │   │
│                                    │  ├─ XlsxBuilder     │   │
│                                    │  │  (ExcelJS)       │   │
│                                    │  └─ CsvBuilder      │   │
│                                    │     (fast-csv)      │   │
│                                    └─────────┬──────────-┘   │
│                                              │               │
│                                    ┌─────────▼──────────┐   │
│                                    │   FTP Storage       │   │
│                                    │   (ftp/basic-ftp)   │   │
│                                    └─────────-──────────-┘   │
│                                              │               │
│                                    ┌─────────▼──────────┐   │
│                                    │   SQL Server        │   │
│                                    │   ReportJob table   │   │
│                                    │   (Prisma CNSWEB)   │   │
│                                    └────────────────────-┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Data Model

### 6.1 New Prisma Model: `ReportJob`

Add to `backend/prisma/cnsweb/reportJob.prisma` **(new file)**:

```prisma
model ReportJob {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  reportType   String   // e.g. "member_list", "trec_holder_summary"
  format       String   // "PDF" | "XLSX" | "CSV"
  filters      String?  // JSON string of applied filter params
  status       String   @default("PENDING")
  // PENDING | PROCESSING | COMPLETED | FAILED | CANCELLED

  bullJobId    String?  // BullMQ job ID for queue tracking
  ftpPath      String?  // FTP path to generated file
  fileSize     Int?     // bytes
  errorMessage String?

  requestedAt  DateTime @default(now())
  startedAt    DateTime?
  completedAt  DateTime?

  @@index([userId], name: "idx_reportJob_userId")
  @@index([status], name: "idx_reportJob_status")
  @@index([reportType], name: "idx_reportJob_reportType")
}
```

Also add the relation back-reference to `auth.prisma` > `User` model:
```prisma
reportJobs   ReportJob[]
```

---

## 7. Backend Implementation Plan

### 7.1 New Dependencies

```bash
# In backend/ — install via pnpm
pnpm add p-queue puppeteer exceljs fast-csv
pnpm add -D @types/fast-csv
```

> **Notes:**
> - `pdfkit` is already installed — use it as fallback/simple PDF; use Puppeteer for branded HTML-based PDFs.
> - `p-queue` replaces BullMQ+Redis: same interface pattern, no infrastructure needed. Migrate to BullMQ later by swapping `queues/report.queue.ts` only.
> - Local disk storage: files saved to `backend/uploads/reports/<userId>/<jobId>.<ext>`. Served via Express static or streamed via `/download/:id`.
> - Puppeteer on Windows: Chromium auto-downloaded to `node_modules/puppeteer/.local-chromium` on first `pnpm install`.

### 7.2 File Structure

```
backend/src/app/
├── modules/
│   ├── auth/                          # existing
│   └── reports/                       # NEW FEATURE MODULE
│       ├── report.route.ts
│       ├── report.controller.ts
│       ├── report.service.ts
│       ├── report.interface.ts
│       └── builders/
│           ├── base.builder.ts        # abstract ReportBuilder
│           ├── pdf.builder.ts         # Puppeteer HTML→PDF
│           ├── xlsx.builder.ts        # ExcelJS
│           └── csv.builder.ts         # fast-csv
├── workers/
│   └── report.worker.ts               # p-queue worker (processes jobs)
├── queues/
│   └── report.queue.ts                # p-queue singleton (in-memory)
└── lib/
    └── storage.ts                     # Local disk storage wrapper (NEW)
                                       # Handles: save / stream / delete
                                       # Base path: backend/uploads/reports/
```

### 7.3 API Endpoints

#### `POST /api/v1/reports/request`
Request a new report generation job.

**Request Body:**
```ts
{
  reportType: "member_list" | "trec_holder_summary" | "user_activity" | "financial_summary";
  format: "PDF" | "XLSX" | "CSV";
  filters?: {
    dateFrom?: string;    // ISO date
    dateTo?: string;
    memberCode?: string;
    region?: string;
    // ... extensible per reportType
  };
}
```

**Response `202 Accepted`:**
```ts
{
  success: true;
  message: "Report generation queued";
  data: {
    jobId: string;       // ReportJob.id (UUID)
    bullJobId: string;   // BullMQ internal job ID
    status: "PENDING";
    estimatedWait: number; // seconds
  }
}
```

---

#### `GET /api/v1/reports/jobs`
List the current user's report jobs (paginated, uses existing `QueryBuilder`).

**Query Params:** `?page=1&limit=10&status=COMPLETED&reportType=member_list`

**Response `200`:**
```ts
{
  success: true;
  data: ReportJob[];
  meta: { page, limit, total, totalPages }  // QueryBuilder standard
}
```

---

#### `GET /api/v1/reports/jobs/:id`
Get single job status — polled by TanStack Query every 3 seconds.

**Response `200`:**
```ts
{
  success: true;
  data: ReportJob  // includes status, ftpPath on COMPLETED
}
```

---

#### `GET /api/v1/reports/download/:id`
Stream the file from FTP to the client as a download.

**Behaviour:**
- Validates job belongs to requesting user (or user is ADMIN/IT)
- Connects to FTP, pipes file stream to response
- Sets `Content-Disposition: attachment; filename="<reportType>_<date>.<ext>"`

**Response `200`:** Binary file stream  
**Response `403`:** Not authorised  
**Response `404`:** Job not found or file missing on FTP  

---

#### `DELETE /api/v1/reports/jobs/:id`
Cancel a `PENDING` or `PROCESSING` job.

---

### 7.4 BullMQ Queue & Worker

**`queues/report.queue.ts`**
```ts
import PQueue from 'p-queue';

// Concurrency=2: process max 2 reports simultaneously
export const reportQueue = new PQueue({ concurrency: 2 });

// Helper to enqueue a job
export const enqueueReportJob = (jobFn: () => Promise<void>) =>
  reportQueue.add(jobFn);
```

**`workers/report.worker.ts`**
```ts
// processReportJob(reportJobId: string): Promise<void>
// 1. Update ReportJob status → PROCESSING
// 2. Fetch data from correct Prisma client (cns or cnsweb)
// 3. Call appropriate Builder (pdf/xlsx/csv)
// 4. Save Buffer to local disk via storage.ts
// 5. Update ReportJob: status=COMPLETED, filePath, fileSize, completedAt
// On error: status=FAILED, errorMessage
// Imported in server.ts — no separate process needed
```

**Job Payload interface:**
```ts
interface ReportJobPayload {
  reportJobId: string;   // DB record ID
  userId: string;
  reportType: string;
  format: string;
  filters: Record<string, unknown>;
}
```

### 7.5 Builder Pattern

```ts
// base.builder.ts
abstract class ReportBuilder {
  abstract generate(data: unknown[], filters: Record<string, unknown>): Promise<Buffer>;
  abstract get mimeType(): string;
  abstract get extension(): string;
}

// pdf.builder.ts   → launches headless Puppeteer, renders an EJS template → PDF Buffer
// xlsx.builder.ts  → ExcelJS Workbook → Buffer
// csv.builder.ts   → fast-csv stringify → Buffer
```

EJS templates for PDF go in: `backend/src/app/templates/reports/`

### 7.6 FTP Client Wrapper

```ts
// lib/ftp.ts
// Wraps basic-ftp Client with:
// - uploadBuffer(buffer, remotePath) → string (FTP path)
// - downloadStream(remotePath) → ReadableStream
// - deleteFile(remotePath)
// Remote path pattern: /reports/<userId>/<reportJobId>.<ext>
```

---

## 8. Frontend Implementation Plan

### 8.1 New Dependencies

```bash
# In frontend/ — install via pnpm
# TanStack Query v5 is already installed ✅
# Tailwind v4 is already installed ✅
# shadcn components already installed ✅
# No new dependencies needed for v1 frontend
```

### 8.2 File Structure

```
frontend/src/
├── app/
│   └── (dashboardLayout)/
│       └── reports/                         # NEW ROUTE GROUP
│           ├── page.tsx                     # Report request page (Server Component filters)
│           ├── loading.tsx
│           └── download-center/
│               ├── page.tsx                 # Download Center (Server Component shell)
│               └── loading.tsx
├── components/
│   └── modules/
│       └── reports/                         # NEW COMPONENTS
│           ├── ReportRequestForm.tsx        # Filter form (Client Component)
│           ├── DownloadCenter.tsx           # Job list with polling (Client Component)
│           ├── JobStatusBadge.tsx           # Status pill (PENDING/PROCESSING/COMPLETED/FAILED)
│           ├── JobProgressCard.tsx          # Individual job card with progress indicator
│           └── ReportTypeSelector.tsx       # Report type radio/tabs
├── services/
│   └── reportService.ts                     # NEW: axios API calls
├── types/
│   └── report.types.ts                      # NEW: TypeScript interfaces
└── constants/
    └── reportConstants.ts                   # NEW: report type configs
```

### 8.3 Key Frontend Components

#### `ReportRequestForm.tsx` (Client Component)
- Tabs per report type with format selectors (PDF / XLSX / CSV)
- Date range picker using existing shadcn components
- On submit: POST to `/api/v1/reports/request` via `reportService`
- On success: redirect to Download Center with toast notification (sonner already installed ✅)
- Zod validation schema (already installed ✅)

#### `DownloadCenter.tsx` (Client Component)
- Uses `useQuery` (TanStack Query v5) to fetch job list
- **Polling logic:** For any job with `status === PENDING | PROCESSING`, uses `refetchInterval: 3000`
- Stops polling when all visible jobs are terminal (`COMPLETED | FAILED | CANCELLED`)
- Download button triggers `GET /api/v1/reports/download/:id` as a direct `<a href>` link
- Cancel button calls `DELETE /api/v1/reports/jobs/:id`

#### `JobStatusBadge.tsx`
```
PENDING    → gray badge + animated spinner
PROCESSING → blue badge + animated progress bar
COMPLETED  → green badge + download icon
FAILED     → red badge + retry button
CANCELLED  → gray strikethrough badge
```

### 8.4 TanStack Query Hooks

```ts
// In a new hooks file: src/lib/hooks/useReportJobs.ts
export const useReportJobs = () =>
  useQuery({
    queryKey: ['report-jobs'],
    queryFn: () => reportService.getJobs(),
    refetchInterval: (query) => {
      const hasActiveJobs = query.state.data?.data?.some(
        (j) => j.status === 'PENDING' || j.status === 'PROCESSING'
      );
      return hasActiveJobs ? 3000 : false;
    },
  });

export const useReportJob = (id: string) =>
  useQuery({
    queryKey: ['report-job', id],
    queryFn: () => reportService.getJob(id),
    refetchInterval: (query) => {
      const terminal = ['COMPLETED', 'FAILED', 'CANCELLED'];
      return terminal.includes(query.state.data?.data?.status ?? '') ? false : 3000;
    },
  });
```

### 8.5 Service Layer

```ts
// services/reportService.ts
// All calls go through the existing src/proxy.ts pattern
export const reportService = {
  requestReport: (payload: ReportRequestPayload) =>
    axios.post('/api/v1/reports/request', payload),
  getJobs: (params?: JobQueryParams) =>
    axios.get('/api/v1/reports/jobs', { params }),
  getJob: (id: string) =>
    axios.get(`/api/v1/reports/jobs/${id}`),
  downloadReport: (id: string) =>
    window.open(`<BACKEND_URL>/api/v1/reports/download/${id}`, '_blank'),
  cancelJob: (id: string) =>
    axios.delete(`/api/v1/reports/jobs/${id}`),
};
```

---

## 9. Storage Configuration

### 9.1 New Environment Variables

**`backend/.env` additions:**
```env
# Local disk storage for reports
REPORTS_UPLOAD_DIR=uploads/reports
REPORTS_BASE_URL=http://localhost:5000/uploads/reports

# Report queue concurrency
REPORT_QUEUE_CONCURRENCY=2
```

### 9.2 `lib/storage.ts`
```ts
import fs from 'fs/promises';
import path from 'path';

const BASE = path.resolve('uploads/reports');

export const storageLib = {
  // saves Buffer, returns relative filePath stored in DB
  saveReport: async (userId: string, jobId: string, ext: string, buffer: Buffer) => { ... },
  // returns absolute path for streaming
  getAbsolutePath: (filePath: string) => path.join(BASE, filePath),
  deleteReport: async (filePath: string) => { ... },
};
```

Express serves the uploads folder statically in dev:
```ts
app.use('/uploads', express.static(path.resolve('uploads')));
```

---

## 10. Phased Implementation Plan

### Phase 1 — Backend Foundation (Week 1)
> Priority: Core infrastructure with no UI yet

- [ ] Install `bullmq`, `ioredis`, `exceljs`, `fast-csv`, `basic-ftp`, `puppeteer`
- [ ] Create `lib/redis.ts` and `lib/ftp.ts`
- [ ] Add `ReportJob` Prisma model + run `pnpm generate` + `pnpm push:cnsweb`
- [ ] Add `reportJobs` relation to `User` model
- [ ] Create `queues/report.queue.ts`
- [ ] Create `modules/reports/report.interface.ts` (all TypeScript types)
- [ ] Create `modules/reports/report.service.ts` (DB CRUD for ReportJob)
- [ ] Create `modules/reports/report.controller.ts` (POST, GET, DELETE endpoints)
- [ ] Create `modules/reports/report.route.ts` + register in `routes/index.ts`
- [ ] Verify endpoints work via Postman/curl

### Phase 2 — Job Workers & Builders (Week 2)
> Priority: Actual file generation

- [ ] Create `builders/base.builder.ts` abstract class
- [ ] Create `builders/csv.builder.ts` (fast-csv) + test with Member data
- [ ] Create `builders/xlsx.builder.ts` (ExcelJS) + test with Member data
- [ ] Create `templates/reports/` EJS HTML templates for PDF
- [ ] Create `builders/pdf.builder.ts` (Puppeteer) + test rendering
- [ ] Create `workers/report.worker.ts` with full PROCESSING→COMPLETED/FAILED lifecycle
- [ ] Import worker in `server.ts` (start worker on boot)
- [ ] End-to-end test: request job → check DB status → check FTP upload

### Phase 3 — Frontend UI (Week 3)
> Priority: Download Center + request form

- [ ] Create `types/report.types.ts` and `constants/reportConstants.ts`
- [ ] Create `services/reportService.ts`
- [ ] Create `lib/hooks/useReportJobs.ts` with polling logic
- [ ] Build `ReportTypeSelector.tsx` component
- [ ] Build `ReportRequestForm.tsx` with Zod validation
- [ ] Create route `app/(dashboardLayout)/reports/page.tsx`
- [ ] Build `JobStatusBadge.tsx` component
- [ ] Build `JobProgressCard.tsx` component
- [ ] Build `DownloadCenter.tsx` with TanStack Query polling
- [ ] Create route `app/(dashboardLayout)/reports/download-center/page.tsx`
- [ ] Add navigation links in dashboard sidebar

### Phase 4 — Polish & Edge Cases (Week 4)
> Priority: Production readiness

- [ ] Retry button for FAILED jobs (re-queues to BullMQ)
- [ ] ADMIN view: see all users' jobs (`GET /api/v1/reports/jobs?all=true`)
- [ ] File cleanup: delete FTP file if job is cancelled
- [ ] BullMQ dashboard (optional: `bull-board` package) at `/admin/queues`
- [ ] Rate limiting: max 5 concurrent jobs per user
- [ ] Graceful shutdown: drain BullMQ queue before `process.exit`
- [ ] Logging: log job lifecycle events with timestamps

---

## 11. TypeScript Interfaces

```ts
// report.interface.ts
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ReportFormat = 'PDF' | 'XLSX' | 'CSV';
export type ReportType = 'member_list' | 'trec_holder_summary' | 'user_activity' | 'financial_summary';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  memberCode?: string;
  region?: string;
  userId?: string;
}

export interface CreateReportJobDto {
  reportType: ReportType;
  format: ReportFormat;
  filters?: ReportFilters;
}

export interface ReportJobPayload {
  reportJobId: string;
  userId: string;
  reportType: ReportType;
  format: ReportFormat;
  filters: ReportFilters;
}
```

---

## 12. Security Considerations

| Concern | Mitigation |
|---|---|
| Unauthorised download | `GET /download/:id` validates `ReportJob.userId === req.user.id` (or ADMIN role) |
| Path traversal on FTP | FTP path is constructed server-side from UUID, never user input |
| Queue flooding | Rate limit: max 5 pending/processing jobs per user (checked in `report.service.ts`) |
| Large data exports | BullMQ's `attempts: 3` + timeout per job type; streaming CSV for large datasets |
| Redis exposure | Redis bound to `127.0.0.1` only; password-protected in prod |

---

## 13. Acceptance Criteria

### Backend
- [ ] `POST /api/v1/reports/request` returns `202` with a valid `jobId`
- [ ] `ReportJob` row is created in SQL Server with `status = PENDING`
- [ ] BullMQ worker picks up the job within 5 seconds
- [ ] `status` transitions correctly: `PENDING → PROCESSING → COMPLETED`
- [ ] Generated file is uploaded to FTP with correct path
- [ ] `GET /api/v1/reports/download/:id` streams the correct file
- [ ] Failed jobs set `status = FAILED` with `errorMessage`
- [ ] Unauthorised download returns `403`

### Frontend
- [ ] Report request form validates all inputs before submit
- [ ] On successful submit, user is shown a success toast and redirected to Download Center
- [ ] Download Center shows the new job with `PENDING` status immediately
- [ ] Status auto-updates without page refresh every 3 seconds
- [ ] Once `COMPLETED`, a Download button appears
- [ ] Polling stops when all visible jobs are in terminal states
- [ ] Download triggers file download in browser (not new tab)
- [ ] Cancel button removes job from active state

---

## 14. Open Questions for Review

> [!IMPORTANT]
> Please answer these before Phase 1 begins:

1. **FTP vs Local/Cloud Storage**: Do you have an FTP server already provisioned, or should we consider local disk storage first for development and FTP for production?

2. **Redis availability**: Is Redis installed/available on your dev machine or server? If not, we can use `bullmq`'s `MemoryQueue` for development only.

3. **Report data scope**: The `Member` model is in the `cns` database and `TrecHolder`/`User` in `cnsweb`. The worker will need both Prisma clients. Shall we create a dedicated `prisma.reports.ts` lib that exposes both clients?

4. **FTP security**: Should FTP be `FTPS` (TLS) in production? `basic-ftp` supports it natively.

5. **PDF template style**: Should PDF reports match the application's visual brand (logo, colours)? If yes, please provide brand assets.

6. **Puppeteer on server**: Puppeteer requires Chromium. On Windows dev this is auto-downloaded. On a Linux prod server, you may need `puppeteer-core` + a system Chromium. Are you deploying to Linux?
