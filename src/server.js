import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./lib/config/env.js";
import { connectDB, disconnectDB } from "./lib/db/mongodb.js";
import { logger } from "./pkg/logger/logger.js";

const app = createApp();
const server = http.createServer(app);

let shuttingDown = false;

async function shutDownServer(signal, exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received, shutting down...`);

    server.close(async () => {
        await disconnectDB().catch(() => {});
        process.exit(exitCode);
    });

    // force exit if connections hang
    setTimeout(() => process.exit(1), 10000).unref();
}

async function start() {
    await connectDB();
    server.listen(env.port, () => {
        logger.info(`🚀 Server running on port ${env.port}`);
    });
}

// signals belong to `process`, not `server`
process.on("SIGINT", () => shutDownServer("SIGINT")); // Ctrl+C
process.on("SIGTERM", () => shutDownServer("SIGTERM")); // killed by system/host
process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", { reason: reason?.message ?? String(reason), stack: reason?.stack });
});
process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", { error: error.message, stack: error.stack });
    shutDownServer("uncaughtException", 1);
});

start().catch(() => process.exit(1));
