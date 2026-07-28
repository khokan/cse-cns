import PQueue from "p-queue";
import { envVars } from "../config/env.js";

// ---------------------------------------------------------------------------
// In-memory report job queue (p-queue).
// Concurrency is controlled by REPORT_QUEUE_CONCURRENCY env var (default 2).
// Swap this file with a BullMQ implementation when Redis is available.
// ---------------------------------------------------------------------------

export const reportQueue = new PQueue({
    concurrency: envVars.REPORT_QUEUE_CONCURRENCY ?? 2,
});

// Log queue activity in development
if (envVars.NODE_ENV === "development") {
    reportQueue.on("active", () => {
        console.log(
            `📊 [ReportQueue] Job started. Size: ${reportQueue.size} | Pending: ${reportQueue.pending}`
        );
    });

    reportQueue.on("idle", () => {
        console.log("📊 [ReportQueue] All jobs completed. Queue is idle.");
    });

    reportQueue.on("error", (err) => {
        console.error("📊 [ReportQueue] Queue error:", err);
    });
}

/**
 * Adds a function to the report queue and returns a handle.
 * The caller is responsible for updating DB status inside the job function.
 */
export const enqueueReportJob = (jobFn: () => Promise<void>): void => {
    reportQueue.add(jobFn).catch((err) => {
        console.error("📊 [ReportQueue] Failed to enqueue job:", err);
    });
};
