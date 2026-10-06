import http from 'http';
import mongoose from 'mongoose';
import { createApp } from './index.js';
import { env } from './lib/config/env.js';
import { logger } from './pkg/logger/logger.js';

const app = createApp();
const server = http.createServer(app);

server.listen(env.port, () => {
    logger.info(`🚀 Server running on port ${env.port}`);
});

let shuttingDown = false;

async function shutDownServer(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received, shutting down...`);

    server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
    });

    // force exit if connections hang
    setTimeout(() => process.exit(1), 10000).unref();
}

// signals belong to `process`, not `server`
process.on('SIGINT', () => shutDownServer('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => shutDownServer('SIGTERM')); // killed by system/host