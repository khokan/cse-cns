# Redis Implementation in Backend

Redis is a critical component of the backend architecture, serving as the message broker and state store for asynchronous job processing via BullMQ, as well as providing caching and session management capabilities.

## Architecture Overview

```
Frontend (Next.js)
    ↓
Express Backend (Node.js)
    ↓
Redis Server (In-Memory Data Store)
    ↓
BullMQ Queues & Workers (Background Job Processing)
```

## Redis Installation & Setup

### Windows Installation
```bash
# Download from official Microsoft Archive
https://github.com/microsoftarchive/redis/releases

# Extract and run
redis-server.exe
# Default: runs on port 6379
```

### Configuration in Backend
The backend connects to Redis via two distinct instances:

1. **General-Purpose Redis Client** (`lib/redis.ts`)
   - Used for caching, session management, and general operations
   - Single connection with reconnect strategy

2. **BullMQ-Dedicated Redis Connection** (`lib/redis.ts`)
   - Separate connection pool for job queue management
   - Higher reliability for critical queue operations

### Environment Configuration
```bash
# .env.local or .env.production
REDIS_URL=redis://:password@host:port
# Example: REDIS_URL=redis://:myPassword@192.168.105.44:6379

# Optional: Override connection details
REDIS_HOST=192.168.105.44
REDIS_PORT=6379
REDIS_PASSWORD=myPassword
```

## Core Redis Implementation

### 1. Redis Client Setup (`lib/redis.ts`)

```typescript
import { Redis } from "ioredis";
import { envVars } from "../config/env.js";
import logger from "../utils/logger.js";

type RedisError = Error & { code?: string };

// Shared connection options with smart error handling
const redisOptions = {
    enableReadyCheck: false,
    lazyConnect: true,
    enableOfflineQueue: false,
    reconnectOnError: (err: RedisError) => {
        const code = err.code ?? "UNKNOWN";
        logger.warn(`⚠️ [Redis] Connection error (${code}) — retrying in background.`);
        return true; // Keep retrying in background
    },
    retryStrategy: (times: number) => {
        if (times === 1) {
            logger.warn(`⚠️ [Redis] Connection unavailable. System running with fallback.`);
        }
        const delay = Math.min(times * 1000, 5000);
        return delay;
    },
};

// General-purpose Redis client (caching, sessions, etc.)
export const redisClient = new Redis(envVars.REDIS_URL, {
    ...redisOptions,
    maxRetriesPerRequest: 1,
    commandTimeout: 2000,
});

// BullMQ-dedicated connection (high reliability for job queuing)
export const bullMqRedisConnection = new Redis(envVars.REDIS_URL, {
    ...redisOptions,
    maxRetriesPerRequest: null,
});

// Health check functions
export function isRedisConnected(): boolean {
    return redisClient.status === "ready" || redisClient.status === "connect";
}

export function isBullMqRedisConnected(): boolean {
    return bullMqRedisConnection.status === "ready" || bullMqRedisConnection.status === "connect";
}

// Connection event handlers with smart logging
redisClient.on("ready", () => {
    logger.info("✅ [Redis] Connection established & ready.");
});

redisClient.on("error", (err) => {
    logger.warn(`⚠️ [Redis] Connection notice: ${err.message}. System continuing normally without cache.`);
});

bullMqRedisConnection.on("ready", () => {
    logger.info("✅ [BullMQ Redis] Connection ready.");
});

bullMqRedisConnection.on("error", (err) => {
    logger.warn(`⚠️ [BullMQ Redis] Connection notice: ${err.message}. System continuing with direct queue fallback.`);
});
```

### 1b. Connection Initialization

```typescript
/**
 * Initiates Redis connections in the background.
 * Errors are intentionally swallowed here — the 'error' event listeners
 * on each client handle logging. The app proceeds normally without Redis.
 */
export function connectRedis(): void {
    redisClient.connect().catch(() => { /* handled by 'error' event */ });
    bullMqRedisConnection.connect().catch(() => { /* handled by 'error' event */ });
}
```

Call this during server initialization:

```typescript
// in app.ts or server.ts
import { connectRedis } from "../lib/redis.js";

// Connect to Redis (non-blocking, errors handled gracefully)
connectRedis();

// Start Express server normally
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### 2. BullMQ Queue Definitions

The backend uses `bullmq` (not the older `bull` package) with TypeScript types for type safety.

#### Report Queue (`queues/report.queue.ts`)
```typescript
import { Queue } from "bullmq";
import { bullMqRedisConnection, isBullMqRedisConnected } from "../lib/redis.js";
import { processReportJob } from "../workers/report.worker.js";
import type { ReportJobPayload } from "../modules/reports/report.interface.js";
import logger from "../utils/logger.js";

export const REPORT_QUEUE_NAME = "report-queue";

export const reportQueue = new Queue<ReportJobPayload>(REPORT_QUEUE_NAME, {
    connection: bullMqRedisConnection,
    defaultJobOptions: {
        attempts: 3,                    // Retry failed jobs 3 times
        backoff: {
            type: "exponential",
            delay: 2000,               // Start with 2 second delay
        },
        removeOnComplete: 100,         // Keep last 100 completed jobs
        removeOnFail: 500,             // Keep last 500 failed jobs for debugging
    },
});

/**
 * Enqueues a report job with intelligent fallback.
 * If Redis is down, the job is processed directly in background.
 */
export const enqueueReportJob = async (payload: ReportJobPayload): Promise<void> => {
    try {
        if (isBullMqRedisConnected()) {
            await reportQueue.add(`report:${payload.reportType}:${payload.reportJobId}`, payload, {
                jobId: payload.reportJobId,
            });
            logger.info(`📊 [ReportQueue] Enqueued BullMQ job: ${payload.reportJobId}`);
            return;
        }
        logger.info(`ℹ️ [ReportQueue] Redis offline. Processing report job ${payload.reportJobId} directly...`);
    } catch (err) {
        logger.warn(`⚠️ [ReportQueue] Failed to enqueue. Falling back to direct execution:`, err);
    }

    // Fallback: Process directly in background if Redis unavailable
    processReportJob(payload).catch((err) => {
        logger.error(`❌ [ReportFallback] Direct processing failed:`, err);
    });
};
```

#### Settlement Queue (`queues/settlement.queue.ts`)
```typescript
import { Queue } from "bullmq";
import { bullMqRedisConnection, isBullMqRedisConnected } from "../lib/redis.js";
import { processSettlementJob } from "../workers/settlement.worker.js";
import type { SettlementJobPayload } from "../modules/settlement/settlement.interface.js";
import logger from "../utils/logger.js";

export const SETTLEMENT_QUEUE_NAME = "settlement-queue";

export const settlementQueue = new Queue<SettlementJobPayload>(SETTLEMENT_QUEUE_NAME, {
    connection: bullMqRedisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,               // 3 second initial backoff
        },
        removeOnComplete: 100,         // Keep last 100 completed
        removeOnFail: 500,             // Keep last 500 failed
    },
});

/**
 * Enqueues a settlement job with intelligent fallback.
 */
export const enqueueSettlementJob = async (payload: SettlementJobPayload): Promise<void> => {
    try {
        if (isBullMqRedisConnected()) {
            await settlementQueue.add(`settlement:${payload.contractNumber}`, payload, {
                jobId: `settlement_${payload.contractNumber}_${Date.now()}`,
            });
            logger.info(`⚖️ [SettlementQueue] Enqueued BullMQ job: ${payload.contractNumber}`);
            return;
        }
        logger.info(`ℹ️ [SettlementQueue] Redis offline. Processing settlement directly...`);
    } catch (err) {
        logger.warn(`⚠️ [SettlementQueue] Failed to enqueue. Falling back:`, err);
    }

    // Fallback: Process directly in background
    processSettlementJob(payload).catch((err) => {
        logger.error(`❌ [SettlementFallback] Direct processing failed:`, err);
    });
};
```

### 3. Worker Processes

#### Report Worker (`workers/report.worker.ts`)

The report worker uses `bullmq`'s `Worker` class and includes comprehensive job processing logic:

```typescript
import { Worker, Job } from "bullmq";
import { bullMqRedisConnection, reportCache } from "../lib/redis.js";
import { REPORT_QUEUE_NAME } from "../queues/report.queue.js";
import { db } from "../lib/prisma.js";
import { storageLib } from "../lib/storage.js";
import { CsvBuilder, XlsxBuilder, PdfBuilder } from "../modules/reports/builders/index.js";
import type { ReportJobPayload, ReportFormat } from "../modules/reports/report.interface.js";
import { emitToUser } from "../lib/socket.js";
import logger from "../utils/logger.js";

/**
 * Worker processes report generation jobs from the queue.
 * Handles CSV, XLSX, and PDF formats.
 */
export const reportWorker = new Worker<ReportJobPayload>(REPORT_QUEUE_NAME, async (job: Job<ReportJobPayload>) => {
    const { reportType, format, filters, userId, reportJobId } = job.data;

    try {
        // Update job status to PROCESSING
        await db.cnsweb.reportJob.update({
            where: { id: reportJobId },
            data: { status: "PROCESSING", startedAt: new Date() },
        });

        // Emit real-time update to client
        emitToUser(userId, "report:status", {
            jobId: reportJobId,
            status: "PROCESSING",
        });

        // Generate report based on format and type
        let fileBuffer: Buffer;
        switch (format) {
            case "pdf":
                fileBuffer = await new PdfBuilder().generate(reportType, filters);
                break;
            case "xlsx":
                fileBuffer = await new XlsxBuilder().generate(reportType, filters);
                break;
            case "csv":
            default:
                fileBuffer = await new CsvBuilder().generate(reportType, filters);
        }

        // Save to storage
        const filename = `${reportType}-${Date.now()}.${format}`;
        const filePath = await storageLib.save(fileBuffer, filename);

        // Update job status to COMPLETED
        await db.cnsweb.reportJob.update({
            where: { id: reportJobId },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                filePath,
                fileName: filename,
                fileSize: fileBuffer.length,
            },
        });

        // Cache the job result for 10 seconds
        await reportCache.setJob(reportJobId, { filePath, fileName: filename });

        // Emit completion to client
        emitToUser(userId, "report:status", {
            jobId: reportJobId,
            status: "COMPLETED",
            filePath,
            fileName: filename,
        });

        logger.info(`✅ [ReportWorker] Completed: ${reportJobId}`);
        return { success: true, filePath, fileName: filename };

    } catch (error) {
        logger.error(`❌ [ReportWorker] Failed: ${reportJobId}`, error);

        // Update job status to FAILED
        await db.cnsweb.reportJob.update({
            where: { id: reportJobId },
            data: {
                status: "FAILED",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
                completedAt: new Date(),
            },
        });

        // Emit error to client
        emitToUser(userId, "report:status", {
            jobId: reportJobId,
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
        });

        throw error;
    }
}, {
    connection: bullMqRedisConnection,
    concurrency: 4,  // Process 4 reports concurrently
});

/**
 * Direct processing fallback when Redis is unavailable.
 * Processes the job synchronously without BullMQ.
 */
export const processReportJob = async (payload: ReportJobPayload): Promise<void> => {
    // Similar logic to reportWorker, but direct execution
    try {
        logger.info(`⚙️ [ReportFallback] Processing directly: ${payload.reportJobId}`);
        // ... job processing logic ...
    } catch (err) {
        logger.error(`❌ [ReportFallback] Processing failed:`, err);
        throw err;
    }
};

// Worker event handlers
reportWorker.on("completed", (job) => {
    logger.info(`✅ [ReportWorker] Job ${job.id} completed`);
});

reportWorker.on("failed", (job, err) => {
    logger.error(`❌ [ReportWorker] Job ${job?.id} failed:`, err.message);
});

reportWorker.on("error", (err) => {
    logger.error(`❌ [ReportWorker] Error:`, err);
});
```

#### Settlement Worker (`workers/settlement.worker.ts`)

Similar pattern for settlement processing:

```typescript
import { Worker, Job } from "bullmq";
import { bullMqRedisConnection } from "../lib/redis.js";
import { SETTLEMENT_QUEUE_NAME } from "../queues/settlement.queue.js";
import { db } from "../lib/prisma.js";
import type { SettlementJobPayload } from "../modules/settlement/settlement.interface.js";
import { emitToUser } from "../lib/socket.js";
import logger from "../utils/logger.js";

export const settlementWorker = new Worker<SettlementJobPayload>(
    SETTLEMENT_QUEUE_NAME,
    async (job: Job<SettlementJobPayload>) => {
        const { contractNumber, filters, userId } = job.data;

        try {
            // Update status to PROCESSING
            await db.cnsweb.reportJob.update({
                where: { queueJobId: job.id },
                data: { status: "PROCESSING", startedAt: new Date() },
            });

            emitToUser(userId, "settlement:status", {
                jobId: job.id,
                status: "PROCESSING",
            });

            // Settlement generation logic
            const settlementData = await generateSettlementReport(filters);
            const filename = `settlement-${contractNumber}-${Date.now()}.xlsx`;
            const filePath = await storageLib.save(settlementData, filename);

            // Update completion
            await db.cnsweb.reportJob.update({
                where: { queueJobId: job.id },
                data: {
                    status: "COMPLETED",
                    filePath,
                    completedAt: new Date(),
                },
            });

            emitToUser(userId, "settlement:status", {
                jobId: job.id,
                status: "COMPLETED",
                filePath,
            });

            logger.info(`✅ [SettlementWorker] Completed: ${contractNumber}`);
            return { success: true, filePath };

        } catch (error) {
            logger.error(`❌ [SettlementWorker] Failed:`, error);

            await db.cnsweb.reportJob.update({
                where: { queueJobId: job.id },
                data: {
                    status: "FAILED",
                    errorMessage: error instanceof Error ? error.message : "Unknown error",
                    completedAt: new Date(),
                },
            });

            emitToUser(userId, "settlement:status", {
                jobId: job.id,
                status: "FAILED",
                error: error instanceof Error ? error.message : "Unknown error",
            });

            throw error;
        }
    },
    {
        connection: bullMqRedisConnection,
        concurrency: 2,  // Process 2 settlements concurrently
    }
);

export const processSettlementJob = async (payload: SettlementJobPayload): Promise<void> => {
    // Direct processing fallback
    try {
        logger.info(`⚙️ [SettlementFallback] Processing directly: ${payload.contractNumber}`);
        // ... settlement logic ...
    } catch (err) {
        logger.error(`❌ [SettlementFallback] Processing failed:`, err);
        throw err;
    }
};

settlementWorker.on("completed", (job) => {
    logger.info(`✅ [SettlementWorker] Job ${job.id} completed`);
});

settlementWorker.on("failed", (job, err) => {
    logger.error(`❌ [SettlementWorker] Job ${job?.id} failed:`, err.message);
});
```

## Job Lifecycle

### 1. Job Creation (Controller)
```typescript
// reports.controller.ts
export const createReport = catchAsync(async (req, res) => {
    const { reportType, format, filters } = req.body;
    const userId = req.user.id;

    // Create ReportJob record
    const reportJob = await db.cnsweb.reportJob.create({
        data: {
            userId,
            reportType,
            format,
            filters: JSON.stringify(filters),
            status: "PENDING",
            requestedAt: new Date(),
        },
    });

    // Enqueue job to Redis via BullMQ
    const queuedJob = await reportQueue.add(
        {
            reportType,
            format,
            filters,
            userId,
        },
        {
            jobId: reportJob.id,
            priority: 1,
        }
    );

    // Update ReportJob with queue job ID
    await db.cnsweb.reportJob.update({
        where: { id: reportJob.id },
        data: { queueJobId: queuedJob.id.toString() },
    });

    sendResponse(res, {
        statusCode: 202,
        message: "Report generation started",
        data: reportJob,
    });
});
```

### 2. Job Processing (Worker)
- Worker picks up job from Redis queue
- Updates database status to PROCESSING
- Generates file
- Saves to storage
- Updates database with result
- Emits Socket.IO event to frontend

### 3. Job Completion
- Frontend receives realtime update via Socket.IO
- Job removed from Redis after 1 hour (configurable)
- File remains in storage for download

## Cache Management

The backend provides dedicated cache helpers for optimizing frequently-accessed data:

```typescript
// Generic cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        if (!isRedisConnected()) return null;
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        logger.warn(`[Redis] Cache miss for key ${key}:`, err);
        return null;
    }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
        if (!isRedisConnected()) return;
        await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
        logger.warn(`[Redis] Cache set error for key ${key}:`, err);
    }
}

// Report-specific cache
export const reportCache = {
    getMembersList: async <T>() => cacheGet<T>("cache:report:members"),
    setMembersList: async <T>(data: T) => cacheSet("cache:report:members", data, 300), // 5 min TTL
    getJob: async <T>(id: string) => cacheGet<T>(`cache:report:job:${id}`),
    setJob: async <T>(id: string, data: T) => cacheSet(`cache:report:job:${id}`, data, 10), // 10s TTL
};

// Usage in services
const cachedMembers = await reportCache.getMembersList<Member[]>();
if (cachedMembers) {
    return cachedMembers; // Serve from cache
}

// If not cached, fetch from DB and cache
const members = await db.cnsWeb.member.findMany();
await reportCache.setMembersList(members);
return members;
```

### Key Naming Conventions

- `cache:report:members` — Cached member list for reports
- `cache:report:job:{jobId}` — Cached report job status
- `cache:settlement:{contractId}` — Settlement data cache
- `session:{sessionId}` — User session cache

### Cache Invalidation

Always invalidate cache when data changes:

```typescript
// When a member is updated
await db.cnsWeb.member.update({ ... });
await cacheDel("cache:report:members"); // Invalidate list cache

// When a report completes
await reportCache.invalidateJob(jobId);
```

### Queue Data Structure
```
Redis Keys:
- {queue_name}:... (queue prefix)
- {queue_name}:id (next job ID)
- {queue_name}:active (active job IDs)
- {queue_name}:completed (completed job IDs)
- {queue_name}:failed (failed job IDs)
- {queue_name}:delayed (delayed job IDs)
- {queue_name}:wait (waiting job IDs)

Example for "report-queue":
- report-queue:1, report-queue:2 (job data)
- report-queue:active (active jobs set)
- report-queue:completed (completed jobs set)
```

### Retention Policies
```typescript
// In queue configuration
defaultJobOptions: {
    removeOnComplete: 100,  // Keep last 100 completed jobs
    removeOnFail: 500,      // Keep last 500 failed jobs for debugging
}

// Manual cleanup
await reportQueue.clean(24 * 3600 * 1000); // Remove jobs older than 24 hours
await settlementQueue.obliterate({ force: true }); // Clear entire queue
```

## Monitoring & Debugging

### Common Redis Commands
```bash
# Connect to Redis
redis-cli -h 192.168.105.44 -p 6379 -a password

# Check job queue status
KEYS bull:reports:*

# Get specific job data
GET bull:reports:123

# Monitor Redis in real-time
MONITOR

# Check memory usage
INFO memory

# Get queue stats
HGETALL bull:reports:stats
```

### BullMQ Dashboard (Optional)
```bash
# Install Bull Board for web-based monitoring
npm install @bull-board/express @bull-board/ui

# Add to Express app:
import { createBullBoard } from "@bull-board/express";
import { BullAdapter } from "@bull-board/api/bullAdapter";

const { router, setQueues } = createBullBoard({
    queues: [new BullAdapter(reportQueue), new BullAdapter(settlementQueue)],
    options: {
        uiConfig: {
            defaultLanguage: "en",
        },
    },
});

app.use("/admin/queues", router);
```

## Production Best Practices

### 1. Connection Management

The backend implements smart fallback mechanisms when Redis is unavailable:

```typescript
// In redis.ts: Health checks
export function isRedisConnected(): boolean {
    return redisClient.status === "ready" || redisClient.status === "connect";
}

export function isBullMqRedisConnected(): boolean {
    return bullMqRedisConnection.status === "ready" || bullMqRedisConnection.status === "connect";
}

// In queues: Check connection before enqueuing
export const enqueueReportJob = async (payload: ReportJobPayload): Promise<void> => {
    try {
        if (isBullMqRedisConnected()) {
            // Enqueue to Redis
            await reportQueue.add(...);
        } else {
            // Fall back to direct processing
            await processReportJob(payload);
        }
    } catch (err) {
        logger.warn("Redis error, falling back to direct processing");
        await processReportJob(payload);
    }
};
```

### 2. Worker Configuration

Each worker type should be optimized for its workload:

```typescript
// Report worker: 4 concurrent jobs (CPU/IO intensive)
export const reportWorker = new Worker<ReportJobPayload>(REPORT_QUEUE_NAME, reportHandler, {
    connection: bullMqRedisConnection,
    concurrency: 4,
});

// Settlement worker: 2 concurrent jobs (less frequent, more critical)
export const settlementWorker = new Worker<SettlementJobPayload>(SETTLEMENT_QUEUE_NAME, settlementHandler, {
    connection: bullMqRedisConnection,
    concurrency: 2,
});
```

### 3. Job Configuration

```typescript
// In queue definitions
defaultJobOptions: {
    attempts: 3,                    // Retry failed jobs up to 3 times
    backoff: {
        type: "exponential",
        delay: 2000,               // Start with 2 second delay between retries
    },
    removeOnComplete: 100,         // Keep last 100 completed jobs
    removeOnFail: 500,             // Keep last 500 failed jobs for debugging
    timeout: 30000,                // 30 second timeout per job
};
```

### 4. Error Handling & Monitoring

```typescript
// In worker setup
reportWorker.on("completed", (job) => {
    logger.info(`✅ [ReportWorker] Job ${job.id} completed`);
    // Emit metrics to monitoring
});

reportWorker.on("failed", (job, err) => {
    logger.error(`❌ [ReportWorker] Job ${job?.id} failed:`, err.message);
    
    // Alert on critical failures
    if (job?.attemptsMade >= 3) {
        sendAlert(`Report job ${job.id} failed permanently after 3 attempts`, err);
    }
});

reportWorker.on("error", (err) => {
    logger.error(`❌ [ReportWorker] Error:`, err);
});
```

### 5. Scaling to Multiple Workers

For high-volume deployments, run multiple worker instances:

```bash
# worker-instance-1.ts
node --loader ts-node/esm src/workers/report.worker.ts

# worker-instance-2.ts
node --loader ts-node/esm src/workers/report.worker.ts

# worker-instance-3.ts
node --loader ts-node/esm src/workers/settlement.worker.ts

# All instances connect to the same Redis
# and automatically coordinate job distribution
```

Each worker instance will:
- Connect to the same BullMQ Redis connection
- Register its concurrency limit
- Automatically claim available jobs
- Emit events that other instances can monitor

## Troubleshooting

### Connection Issues

Check if Redis is running and accessible:

```bash
# Test Redis connection
redis-cli ping
# Response: PONG

# Check connection details
redis-cli INFO server
redis-cli CONFIG GET "*"

# Verify from Node.js
import { redisClient, isBullMqRedisConnected } from "../lib/redis.js";

console.log("Redis connected:", isBullMqRedisConnected());
```

The backend logs connection status on startup:

```
✅ [Redis] Connection established & ready.
✅ [BullMQ Redis] Connection ready.
```

If Redis is unavailable:

```
⚠️ [Redis] Connection unavailable. System running with fallback.
⚠️ [BullMQ Redis] Connection notice: Error message. System continuing with direct queue fallback.
```

### Queue Stuck or Jobs Not Processing

Check queue status:

```bash
# Connect to Redis CLI
redis-cli -h 192.168.105.44 -p 6379 -a password

# View report queue jobs
KEYS report-queue:*
LRANGE report-queue:wait 0 -1
LRANGE report-queue:active 0 -1
LRANGE report-queue:failed 0 -1

# Get detailed job data
GET report-queue:1
GET report-queue:2
```

Reset a queue if stuck:

```typescript
// Clear completed jobs
await reportQueue.clean(0);

// Remove all pending jobs
await reportQueue.empty();

// Nuclear option: reset entire queue
await reportQueue.obliterate({ force: true });
```

### Memory Management

Monitor and manage Redis memory usage:

```bash
# Check Redis memory usage
redis-cli INFO memory

# Set memory limit (e.g., 256MB)
redis-cli CONFIG SET maxmemory 256mb

# Set eviction policy (LRU = remove least recently used)
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Make configuration persistent
redis-cli CONFIG REWRITE
```

## Integration with Socket.IO

The backend emits real-time updates to connected clients as jobs progress:

```typescript
// In worker processes
import { emitToUser } from "../lib/socket.js";

emitToUser(userId, "report:status", {
    jobId: reportJobId,
    status: "PROCESSING" | "COMPLETED" | "FAILED",
    progress: 45, // Optional: progress percentage
    filePath: "/reports/file.pdf", // On completion
    error: "Error message", // On failure
});
```

Frontend receives updates via Socket.IO listeners and updates UI in real-time without polling:

```typescript
// Frontend: Listen for updates
socket.on("report:status", (data) => {
    console.log(`Report ${data.jobId} status: ${data.status}`);
    updateUIWithStatus(data);
});
```

This creates a seamless user experience where users see job progress immediately.

## Summary

Redis serves as the backbone of asynchronous processing in the backend:

✅ **Queue Management** - BullMQ handles job scheduling and execution  
✅ **Worker Processing** - Multiple workers process jobs concurrently  
✅ **Intelligent Fallback** - Direct processing if Redis becomes unavailable  
✅ **Real-time Updates** - Socket.IO pushes status to frontend  
✅ **Caching** - Optional caching layer for frequently-accessed data  
✅ **Resilience** - Automatic retry and exponential backoff strategies  
✅ **Monitoring** - Queue status visible via Redis CLI or Bull Board  

This architecture enables the frontend to remain responsive while long-running operations (report generation, settlements) execute in the background with full resilience and real-time feedback to users.

## Key Files Reference

- `backend/src/app/lib/redis.ts` — Redis client setup and cache helpers
- `backend/src/app/queues/report.queue.ts` — Report queue definition
- `backend/src/app/queues/settlement.queue.ts` — Settlement queue definition
- `backend/src/app/workers/report.worker.ts` — Report job processor
- `backend/src/app/workers/settlement.worker.ts` — Settlement job processor
- `backend/.env` — Redis connection configuration (REDIS_URL, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
