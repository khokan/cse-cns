import { Queue } from "bullmq";
import { bullMqRedisConnection, isBullMqRedisConnected } from "../lib/redis.js";
import { processReportJob } from "../workers/report.worker.js";
import type { ReportJobPayload } from "../modules/reports/report.interface.js";
import logger from "../utils/logger.js";

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
 * Enqueues a report job into BullMQ, or falls back to direct processing if Redis is unavailable.
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
        logger.info(`ℹ️ [ReportQueue] Redis offline. Processing report job ${payload.reportJobId} directly in background...`);
    } catch (err) {
        logger.warn(`⚠️ [ReportQueue] Failed to enqueue BullMQ job due to Redis error. Falling back to direct execution:`, err instanceof Error ? err.message : err);
    }

    // Direct background fallback execution when Redis/BullMQ is down
    processReportJob(payload).catch((err) => {
        logger.error(`❌ [ReportFallback] Direct processing failed for job ${payload.reportJobId}:`, err instanceof Error ? err.message : err);
    });
};
