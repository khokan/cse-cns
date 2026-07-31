import { Server } from "http";
import app from "./app.js";
import { envVars } from "./app/config/env.js";
import { db } from "./app/lib/prisma.js";
import { seedSuperAdmin } from "./app/utils/seed.js";
import { initSocketServer } from "./app/lib/socket.js";
import { initReportWorker, reportWorker } from "./app/workers/report.worker.js";
import { initSettlementWorker, settlementWorker } from "./app/workers/settlement.worker.js";
import { redisClient } from "./app/lib/redis.js";
import logger from "./app/utils/logger.js";
import { initSentry } from "./app/lib/sentry.js";

let server: Server;

const bootstrap = async () => {
    try {
        initSentry();
        await db.cnsWeb.$connect();
        await db.cns.$connect();
        logger.info("Databases connected", { db: 'cnsweb,cns' });

        await seedSuperAdmin();

        server = app.listen(envVars.PORT, () => {
            logger.info(`Server running on http://localhost:${envVars.PORT}`);
        });

        // Initialize Socket.IO server
        initSocketServer(server);

        // Initialize BullMQ Workers
        initReportWorker();
        initSettlementWorker();
        logger.info("⚙️  [Workers] ReportWorker and SettlementWorker started successfully.");
    } catch (error) {
        logger.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

const gracefulShutdown = async (signal: string, error?: unknown) => {
    logger.warn(`⚠️ ${signal} received. Initiating graceful shutdown...`);
    if (error) {
        logger.error("Error details:", error);
    }

    if (reportWorker) await reportWorker.close();
    if (settlementWorker) await settlementWorker.close();
    if (redisClient) redisClient.disconnect();

    if (server) {
        server.close(async () => {
            logger.info("HTTP server closed.");
            try {
                await db.disconnect();
                logger.info("✅ All database connections closed successfully.");
                process.exit(0);
            } catch (disconnectError) {
                logger.error("Error disconnecting database clients:", disconnectError);
                process.exit(1);
            }
        });
    } else {
        try {
            await db.disconnect();
            logger.info("✅ All database connections closed successfully.");
        } catch (disconnectError) {
            logger.error("Error disconnecting database clients:", disconnectError);
        }
        process.exit(1);
    }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (error) => gracefulShutdown("uncaughtException", error));
process.on("unhandledRejection", (reason) => gracefulShutdown("unhandledRejection", reason));

bootstrap();