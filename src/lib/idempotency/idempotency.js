// src/lib/idempotency/idempotency.js
import { cacheProvider } from '../cache/init.js';
import { logger } from '../../pkg/logger/logger.js';

// raw Upstash client (supports { nx, ex })
const redis = cacheProvider.client;

export function idempotency(ttl = 3600) {
    return async function (req, res, next) {
        try {
            const idempotencyKey = req.headers['x-idempotency-key'];
            if (!idempotencyKey) {
                return res.status(400).json({ error: 'x-idempotency-key header required' });
            }

            const key = `idem:${req.user?.id ?? 'anon'}:${req.method}:${req.originalUrl}:${idempotencyKey}`;

            // atomically claim the key (only one request can win)
            const claimed = await redis.set(key, { status: 'processing' }, { nx: true, ex: ttl });

            if (!claimed) {
                const existing = await redis.get(key);

                if (!existing || existing.status === 'processing') {
                    return res.status(409).json({ error: 'Request already in progress' });
                }

                res.setHeader('x-cache', 'HIT');
                return res.status(existing.statusCode).json(existing.body);
            }

            let settled = false; // true once we saved the result or released the key

            const release = () => {
                if (settled) return;
                settled = true;
                redis.del(key).catch((err) => logger.error('Idempotency del failed: ' + err));
            };

            const originalJson = res.json.bind(res);
            res.json = (body) => {
                const statusCode = res.statusCode;

                if (statusCode >= 200 && statusCode < 300) {
                    settled = true;
                    redis
                        .set(key, { status: 'done', statusCode, body }, { ex: ttl })
                        .catch((err) => logger.error('Idempotency set failed: ' + err));
                } else {
                    release(); // non-2xx: let the client retry with the same key
                }

                res.setHeader('x-cache', 'MISS');
                return originalJson(body);
            };

            // response finished or connection dropped without us saving a result
            // (covers res.send / res.end / aborted requests)
            res.on('finish', release);
            res.on('close', release);

            next();
        } catch (err) {
            logger.error('Idempotency middleware failed: ' + err);
            next(err);
        }
    };
}