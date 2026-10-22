import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./lib/config/env.js";
import { globalErrorHandler, notFoundHandler } from "./lib/errors/error.handler.js";
import { correlationId } from "./lib/correlation/correlationld.js";
import { UPLOADS_DIR } from "./lib/media/multer.js";
import { router } from "./routes.js";

export function createApp() {
    const app = express();

    app.set("trust proxy", env.trustProxy ? 1 : false);
    app.disable("x-powered-by");

    app.use(correlationId);
    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    app.use(
        cors({
            origin: env.corsOrigins,
            credentials: true,
            exposedHeaders: ["X-Correlation-ID", "Retry-After", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
        })
    );
    app.use(`/${UPLOADS_DIR}`, express.static(UPLOADS_DIR, { maxAge: "7d", index: false }));
    app.use(express.json({ limit: "100kb" }));
    app.use(cookieParser());

    app.get("/health", (req, res) => {
        res.status(200).json({ message: "Server is running", success: true, uptime: process.uptime() });
    });

    app.use("/api", router);

    // invalid routes
    app.use(notFoundHandler);

    // global errors (must be last)
    app.use(globalErrorHandler);

    return app;
}
