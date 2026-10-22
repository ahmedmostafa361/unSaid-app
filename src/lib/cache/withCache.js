import { cacheProvider } from "./init.js";
import { getNamespaceVersion } from "./cache.service.js";
import { logger } from "../../pkg/logger/logger.js";

export function withCache({ ttl = 3600, namespace } = {}) {
    return async (req, res, next) => {
        if (req.method !== "GET") return next();

        const ns = typeof namespace === "function" ? namespace(req) : namespace ?? "global";
        const version = await getNamespaceVersion(ns);

        if (version === null) {
            res.setHeader("x-cache", "BYPASS");
            return next();
        }

        const key = `cache:${ns}:v${version}:${req.originalUrl}`;

        try {
            const cached = await cacheProvider.get(key);
            if (cached) {
                res.setHeader("x-cache", "HIT");
                return res.status(200).json(cached);
            }
        } catch (err) {
            logger.warn("Cache read failed", { key, error: err.message });
            res.setHeader("x-cache", "BYPASS");
            return next();
        }

        res.setHeader("x-cache", "MISS");

        // override res.json BEFORE calling next()
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                Promise.resolve(cacheProvider.set(key, body, ttl)).catch((err) =>
                    logger.warn("Cache set failed", { key, error: err.message })
                );
            }
            return originalJson(body);
        };

        next();
    };
}
