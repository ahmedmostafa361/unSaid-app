import mongoose from "mongoose";
import dns from "node:dns";
import { logger } from "../../pkg/logger/logger.js";
import { env } from "../config/env.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

mongoose.set("strictQuery", true);

export async function connectDB() {
    try {
        await mongoose.connect(env.mongoURI);
        logger.info("🍃 Connected to MongoDB");
    } catch (err) {
        logger.error("MongoDB connection error. Make sure MongoDB is running. " + err.message);
        throw err;
    }
}

export async function disconnectDB() {
    await mongoose.disconnect();
}
