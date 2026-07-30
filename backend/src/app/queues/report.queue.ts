import { Queue } from "bullmq";
import { bullMqRedisConnection } from "../lib/redis.js";
import type { ReportJobPayload } from "../modules/reports/report.interface.js";

export const REPORT_QUEUE_NAME = "report-queue";

export const reportQueue = new Queue<ReportJobPayload>(REPORT_QUEUE_NAME, {
    connection: bullMqRedisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

/**
 * Enqueues a report job into BullMQ.
 */
export const enqueueReportJob = async (payload: ReportJobPayload): Promise<void> => {
    try {
        await reportQueue.add(`report:${payload.reportType}:${payload.reportJobId}`, payload, {
            jobId: payload.reportJobId,
        });
        console.log(`📊 [ReportQueue] Enqueued BullMQ job: ${payload.reportJobId}`);
    } catch (err) {
        console.error("📊 [ReportQueue] Failed to enqueue BullMQ job:", err);
        throw err;
    }
};
