import { Worker, Job } from "bullmq";
import { bullMqRedisConnection } from "../lib/redis.js";
import { SETTLEMENT_QUEUE_NAME } from "../queues/settlement.queue.js";
import { db } from "../lib/prisma.js";
import type { SettlementJobPayload } from "../modules/settlement/settlement.interface.js";
import { emitToUser } from "../lib/socket.js";
import { writeAuditLog } from "../utils/auditLog.js";
import logger from "../utils/logger.js";

export let settlementWorker: Worker<SettlementJobPayload> | null = null;

export const processSettlementJob = async (payload: SettlementJobPayload): Promise<void> => {
    const { contractNumber, initiatedBy, data } = payload;

    logger.info(`⚖️ [SettlementWorker] Processing settlement for ContractNumber: ${contractNumber}`);

    emitToUser(initiatedBy, "settlement:status", {
        contractNumber,
        status: "PROCESSING",
    });

    try {
        // Upsert trade/settlement record into CNS DB
        await db.cns.settlement.upsert({
            where: {
                ContractNumber: contractNumber,
            },
            create: {
                ContractNumber: data.contractNumber,
                TradeDate: data.tradeDate ? new Date(data.tradeDate) : new Date(),
                ScripID: data.scripId,
                BuyBrokerCode: data.buyBrokerCode,
                BuyTraderCode: data.buyTraderCode,
                BuyOrdType: data.buyOrdType,
                SellBrokerCode: data.sellBrokerCode,
                SellTraderCode: data.sellTraderCode,
                SellOrdType: data.sellOrdType,
                Quantity: data.quantity,
                Price: data.price,
                ProcessType: data.processType ?? "N",
                TradeTime: data.tradeTime,
            },
            update: {
                ProcessType: data.processType ?? "Y",
                Quantity: data.quantity,
                Price: data.price,
            },
        });

        writeAuditLog({
            userId: initiatedBy,
            action: "SETTLEMENT_INITIATED",
            entity: "Settlement",
            entityId: contractNumber,
            payload: { contractNumber, processType: data.processType },
        });

        emitToUser(initiatedBy, "settlement:status", {
            contractNumber,
            status: "SETTLED",
        });

        logger.info(`✅ [SettlementWorker] Settlement ${contractNumber} completed successfully.`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`❌ [SettlementWorker] Settlement ${contractNumber} failed:`, errorMessage);

        emitToUser(initiatedBy, "settlement:status", {
            contractNumber,
            status: "FAILED",
            errorMessage,
        });
        throw err;
    }
};

export const initSettlementWorker = (): Worker<SettlementJobPayload> | null => {
    try {
        settlementWorker = new Worker<SettlementJobPayload>(
            SETTLEMENT_QUEUE_NAME,
            async (job: Job<SettlementJobPayload>) => {
                await processSettlementJob(job.data);
            },
            { connection: bullMqRedisConnection }
        );

        settlementWorker.on("completed", (job) => {
            logger.info(`✅ [SettlementWorker] Job ${job.id} completed in BullMQ.`);
        });

        settlementWorker.on("failed", (job, err) => {
            logger.error(`❌ [SettlementWorker] Job ${job?.id} failed in BullMQ:`, err.message);
        });

        settlementWorker.on("error", (err) => {
            const code = (err as NodeJS.ErrnoException).code;
            const msg = err.message || "";
            const isTransient =
                code === "ECONNRESET" ||
                code === "ECONNREFUSED" ||
                code === "ETIMEDOUT" ||
                msg.includes("Stream isn't writeable") ||
                msg.includes("enableOfflineQueue");
            if (isTransient) {
                // Transient during Redis offline/restart — BullMQ auto-reconnects and system uses direct fallbacks
                return;
            }
            logger.warn(`⚠️ [SettlementWorker] Worker error: ${err.message}`);
        });

        return settlementWorker;
    } catch (err) {
        logger.warn("⚠️ [SettlementWorker] Could not initialize BullMQ settlement worker (Redis offline). System will use fallback direct execution.");
        return null;
    }
};
