import { cacheProvider } from "../cache/init.js";
import { logger } from "../../pkg/logger/logger.js";
import { AppError } from "../errors/error.js";

const defaultIdentity = (req) => (req.user?.userId ? `user:${req.user.userId}` : `ip:${req.ip}`);

export function rateLimit({ name, windowSeconds, max, identity = defaultIdentity, message }) {
    return async (req, res, next) => {
        const key = `rate:${name}:${identity(req)}`;
        let count;

        try {
            count = await cacheProvider.increment(key);
            if (count === 1) {
                await cacheProvider.expire(key, windowSeconds);
            }
        } catch (err) {
            logger.warn("Rate limiter unavailable, allowing request", { name, error: err.message });
            return next();
        }

        res.setHeader("X-RateLimit-Limit", String(max));
        res.setHeader("X-RateLimit-Remaining", String(Math.max(max - count, 0)));

        if (count <= max) return next();

        let retryAfterSeconds = windowSeconds;
        try {
            const ttl = await cacheProvider.ttl(key);
            if (ttl > 0) {
                retryAfterSeconds = ttl;
            } else {
                await cacheProvider.expire(key, windowSeconds);
            }
        } catch {
            retryAfterSeconds = windowSeconds;
        }

        next(
            new AppError(message ?? "Too many requests. Please try again later", 429, {
                code: "RATE_LIMITED",
                details: { retryAfterSeconds },
            })
        );
    };
}

export const byIpAndEmail = (req) => `ip:${req.ip}:email:${String(req.body?.email ?? "").trim().toLowerCase()}`;
