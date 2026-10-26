import mongoose from "mongoose";
import dns from "node:dns";
import { logger } from "../../pkg/logger/logger.js";
import { env } from "../config/env.js";

if (!env.isServerless) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

mongoose.set("strictQuery", true);

let connecting = null;

export async function connectDB() {
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    if (!connecting) {
        connecting = mongoose
            .connect(env.mongoURI, {
                serverSelectionTimeoutMS: 10000,
                ...(env.isServerless ? { maxPoolSize: 5 } : {}),
            })
            .then((connection) => {
                logger.info("🍃 Connected to MongoDB");
                return connection;
            })
            .catch((err) => {
                connecting = null;
                logger.error("MongoDB connection error. Make sure MongoDB is running. " + err.message);
                throw err;
            });
    }

    return connecting;
}

export async function disconnectDB() {
    connecting = null;
    await mongoose.disconnect();
}
