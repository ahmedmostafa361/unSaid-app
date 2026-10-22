// src/lib/idempotency/idempotency.js
import { cacheProvider } from "../cache/init.js";
import { logger } from "../../pkg/logger/logger.js";
import { AppError } from "../errors/error.js";

// raw Upstash client (supports { nx, ex })
const redis = cacheProvider.client;
const validKey = /^[a-zA-Z0-9_-]{8,128}$/;

export function idempotency(ttl = 3600, { required = true } = {}) {
    return async function (req, res, next) {
        const idempotencyKey = req.headers["x-idempotency-key"];

        if (!idempotencyKey) {
            if (!required) return next();
            return next(new AppError("x-idempotency-key header required", 400, { code: "IDEMPOTENCY_KEY_REQUIRED" }));
        }

        if (!validKey.test(idempotencyKey)) {
            return next(
                new AppError("x-idempotency-key must be 8-128 letters, numbers, dashes or underscores", 400, {
                    code: "INVALID_IDEMPOTENCY_KEY",
                })
            );
        }

        const owner = req.user?.userId ? `user:${req.user.userId}` : `ip:${req.ip}`;
        const key = `idem:${owner}:${req.method}:${req.baseUrl}${req.path}:${idempotencyKey}`;

        try {
            // atomically claim the key (only one request can win)
            const claimed = await redis.set(key, { status: "processing" }, { nx: true, ex: ttl });

            if (!claimed) {
                const existing = await redis.get(key);

                if (!existing || existing.status === "processing") {
                    return next(new AppError("Request already in progress", 409, { code: "REQUEST_IN_PROGRESS" }));
                }

                res.setHeader("x-idempotent-replay", "true");
                return res.status(existing.statusCode).json(existing.body);
            }
        } catch (err) {
            logger.error("Idempotency middleware failed: " + err.message);
            return next(err);
        }

        let settled = false; // true once we saved the result or released the key

        const release = () => {
            if (settled) return;
            settled = true;
            redis.del(key).catch((err) => logger.error("Idempotency del failed: " + err.message));
        };

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            const statusCode = res.statusCode;

            if (statusCode >= 200 && statusCode < 300) {
                settled = true;
                redis
                    .set(key, { status: "done", statusCode, body }, { ex: ttl })
                    .catch((err) => logger.error("Idempotency set failed: " + err.message));
            } else {
                release(); // non-2xx: let the client retry with the same key
            }

            res.setHeader("x-idempotent-replay", "false");
            return originalJson(body);
        };

        // response finished or connection dropped without us saving a result
        // (covers res.send / res.end / aborted requests)
        res.on("finish", release);
        res.on("close", release);

        next();
    };
}
