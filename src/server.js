import http from 'http';
import {createApp} from "./index.js";
import mongoose from "mongoose";
import {env} from "./lib/config/env.js";
import {logger} from "./pkg/logger/logger.js";

const app = createApp();
const server = http.createServer(app);
server.listen(env.port , () => logger.info(`🚀 Server running on port ${env.port}`));

async function shutDownServer() {
    server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
    });

}
server.on('SIGINT',shutDownServer ); /// server closed by me

server.on('SIGTERM', shutDownServer);  /// server closed by himself without me