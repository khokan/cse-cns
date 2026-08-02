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
            delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

export const enqueueSettlementJob = async (payload: SettlementJobPayload): Promise<void> => {
    try {
        if (isBullMqRedisConnected()) {
            await settlementQueue.add(`settlement:${payload.contractNumber}`, payload, {
                jobId: `settlement_${payload.contractNumber}_${Date.now()}`,
            });
            logger.info(`⚖️ [SettlementQueue] Enqueued BullMQ settlement job: ${payload.contractNumber}`);
            return;
        }
        logger.info(`ℹ️ [SettlementQueue] Redis offline. Processing settlement job ${payload.contractNumber} directly in background...`);
    } catch (err) {
        logger.warn(`⚠️ [SettlementQueue] Failed to enqueue settlement job due to Redis error. Falling back to direct execution:`, err instanceof Error ? err.message : err);
    }

    // Direct background fallback execution when Redis/BullMQ is down
    processSettlementJob(payload).catch((err) => {
        logger.error(`❌ [SettlementFallback] Direct settlement processing failed for ${payload.contractNumber}:`, err instanceof Error ? err.message : err);
    });
};
