import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";
import { db } from "./app/lib/prisma";
import { seedSuperAdmin } from "./app/utils/seed";

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

// Process Termination Signal Handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled Exception & Rejection Handlers
process.on("uncaughtException", (error) => gracefulShutdown("uncaughtException", error));
process.on("unhandledRejection", (reason) => gracefulShutdown("unhandledRejection", reason));

bootstrap();