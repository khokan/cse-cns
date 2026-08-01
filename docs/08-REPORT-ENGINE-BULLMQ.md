# Report Generation Engine (BullMQ + Streaming Downloads)

## Overview
Reports (e.g. member listings, TREC holder tax certificates) and settlement exports are generated **asynchronously** to avoid blocking HTTP requests on potentially slow queries/file generation. The pipeline: **API request → enqueue BullMQ job → background worker builds file → Socket.IO notifies client → client downloads via streaming endpoint.**

## Queueing (`queues/report.queue.ts`, `queues/settlement.queue.ts`)
```ts
export const reportQueue = new Queue<ReportJobPayload>(REPORT_QUEUE_NAME, {
  connection: bullMqRedisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
```
- Uses a **dedicated Redis connection** (`bullMqRedisConnection`, `maxRetriesPerRequest: null`) as required by BullMQ's blocking commands, separate from the general-purpose cache Redis client.
- `enqueueReportJob(payload)` adds a job named `report:<reportType>:<reportJobId>`, using the `reportJobId` as the BullMQ `jobId` for idempotency/traceability, and logs enqueue success/failure.
- Retries: up to 3 attempts with exponential backoff (2s base). Completed/failed jobs are pruned (`removeOnComplete: 100`, `removeOnFail: 500`) to bound Redis memory.

## Worker Processing (`workers/report.worker.ts`)
A BullMQ `Worker` listens on `REPORT_QUEUE_NAME` and, per job:
1. Fetches source data — e.g. `fetchMemberList()` (Prisma query against `cnsweb.member`), `fetchUserActivity()` (session/audit data), or raw SQL against `cns` (`$queryRawUnsafe<SpRawRow[]>`) for tax certificate data.
2. Selects the correct **builder** based on `reportType` + `format`:
   - `builders/csv.builder.ts`, `xlsx.builder.ts`, `pdf.builder.ts` — generic tabular builders
   - `builders/tax-certificate.csv.builder.ts`, `.pdf.builder.ts`, `.xlsx.builder.ts` — specialized certificate layout (uses `fast-csv` streaming format for CSV, buffering chunks into a final `Buffer`)
   - `builders/base.builder.ts` — shared `ReportBuilder` interface/contract
3. Writes the generated file via `storageLib` (`lib/storage.ts`) and updates the `ReportJob` row (`status`, `filePath`, `fileName`, `fileSize`, `completedAt`) or records `errorMessage`/`status: FAILED` on failure.
4. Emits a realtime update via `emitToUser(userId, "report:status", {...})` (Socket.IO) so the frontend updates immediately without polling.
5. Logs each step through the shared Winston `logger`.

Settlement jobs (`workers/settlement.worker.ts`) follow the same enqueue → process → notify pattern for settlement-specific exports.

## Streaming Downloads (`report.controller.ts`)
```
GET /reports/download/:id
```
- Validates the requesting user/role can access the job (`ReportService.getJobForDownload`).
- Resolves `mimeType` from file extension via a `MIME_MAP` (falls back to `application/octet-stream`).
- Sets `Content-Disposition: attachment; filename="<downloadName>"` so browsers trigger a file download with the original report file name.
- Calls `storageLib.createReportStream(job.filePath)` to get a **Node.js Readable stream** directly from disk/storage (not loading the whole file into memory), and `stream.pipe(res)` to send it to the client incrementally.
- On stream error, logs via `console.error` and throws an `AppError(500, ...)` so the global error handler returns a clean JSON error instead of a corrupted partial download.

This streaming approach keeps memory usage flat regardless of report file size (important for large XLSX/PDF exports) and lets the HTTP response start flushing bytes as soon as the stream opens.

## Frontend Consumption
- `useReportJobs.ts` — creates jobs (POST `/reports`), lists/polls job status.
- `useJobStatus.ts` — subscribes to `report:status`/`settlement:status` Socket.IO events for instant UI updates (job progress, completion, failure) alongside/instead of polling.
- Download links point directly at `/reports/download/:id`, letting the browser handle the streamed attachment natively.

## Why This Design
- **Non-blocking API:** report/settlement generation can take seconds; jobs return immediately with a job ID.
- **Resilience:** BullMQ retries + Redis persistence mean transient failures (DB hiccup, Redis blip) don't lose work.
- **Scalability:** Workers can run in separate processes/containers from the API server, and Redis-backed queue allows multiple workers to consume without job duplication (job IDs prevent double-enqueue).
- **UX:** Realtime Socket.IO push avoids constant polling for "is my report ready yet?" while still supporting polling as a fallback.
- **Memory-safe downloads:** Streaming instead of buffering entire files avoids OOM risk on large report exports.
