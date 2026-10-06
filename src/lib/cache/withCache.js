import { cacheProvider } from './init.js';
import { logger } from '../../pkg/logger/logger.js';

export function withCache(ttl = 3600) {
    return async (req, res, next) => {
        try {
            const key = `${req.method}-${req.originalUrl}`;

            const cached = await cacheProvider.get(key);
            if (cached) {
                res.setHeader('x-cache', 'HIT');
                return res.status(200).json(cached);
            }

            res.setHeader('x-cache', 'MISS');

            // override res.json BEFORE calling next()
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    Promise.resolve(cacheProvider.set(key, body, ttl))
                        .catch((err) => logger.error('Cache set failed: ' + err));
                }
                return originalJson(body);
            };

            next();
        } catch (err) {
            next(err);
        }
    };
}