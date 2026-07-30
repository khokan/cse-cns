import { Queue } from "bullmq";
import { bullMqRedisConnection } from "../lib/redis.js";
import type { SettlementJobPayload } from "../modules/settlement/settlement.interface.js";

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
        await settlementQueue.add(`settlement:${payload.contractNumber}`, payload, {
            jobId: `settlement_${payload.contractNumber}_${Date.now()}`,
        });
        console.log(`⚖️ [SettlementQueue] Enqueued BullMQ settlement job: ${payload.contractNumber}`);
    } catch (err) {
        console.error("⚖️ [SettlementQueue] Failed to enqueue settlement job:", err);
        throw err;
    }
};
