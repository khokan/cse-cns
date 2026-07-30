import { Server } from "http";
import app from "./app.js";
import { envVars } from "./app/config/env.js";
import { db } from "./app/lib/prisma.js";
import { seedSuperAdmin } from "./app/utils/seed.js";
import { initSocketServer } from "./app/lib/socket.js";
import { initReportWorker, reportWorker } from "./app/workers/report.worker.js";
import { initSettlementWorker, settlementWorker } from "./app/workers/settlement.worker.js";
import { redisClient } from "./app/lib/redis.js";

let server: Server;

const bootstrap = async () => {
    try {
        await db.cnsWeb.$connect();
        await db.cns.$connect();
        console.log("✅ Both databases connected successfully (CNSWeb + CNS)");

        await seedSuperAdmin();

        server = app.listen(envVars.PORT, () => {
            console.log(`🚀 Server running on http://localhost:${envVars.PORT}`);
        });

        // Initialize Socket.IO server
        initSocketServer(server);

        // Initialize BullMQ Workers
        initReportWorker();
        initSettlementWorker();
        console.log("⚙️  [Workers] ReportWorker and SettlementWorker started successfully.");
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

const gracefulShutdown = async (signal: string, error?: unknown) => {
    console.log(`⚠️ ${signal} received. Initiating graceful shutdown...`);
    if (error) {
        console.error("Error details:", error);
    }

    if (reportWorker) await reportWorker.close();
    if (settlementWorker) await settlementWorker.close();
    if (redisClient) redisClient.disconnect();

    if (server) {
        server.close(async () => {
            console.log("HTTP server closed.");
            try {
                await db.disconnect();
                console.log("✅ All database connections closed successfully.");
                process.exit(0);
            } catch (disconnectError) {
                console.error("Error disconnecting database clients:", disconnectError);
                process.exit(1);
            }
        });
    } else {
        try {
            await db.disconnect();
            console.log("✅ All database connections closed successfully.");
        } catch (disconnectError) {
            console.error("Error disconnecting database clients:", disconnectError);
        }
        process.exit(1);
    }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (error) => gracefulShutdown("uncaughtException", error));
process.on("unhandledRejection", (reason) => gracefulShutdown("unhandledRejection", reason));

bootstrap();