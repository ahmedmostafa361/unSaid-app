// redis.js
import { Redis } from '@upstash/redis';

export class RedisCacheProvider {
    client;

    constructor(url, token) {
        // Use explicitly passed credentials if provided, otherwise fall back to process.env
        if (url && token) {
            this.client = new Redis({ url, token });
        } else {
            this.client = Redis.fromEnv();
        }
    }

    async set(key, value, ttl) {
        if (ttl) {
            return this.client.set(key, value, { ex: ttl });
        }
        return this.client.set(key, value);
    }

    async get(key) {
        return this.client.get(key);
    }

    async delete(key) {
        return this.client.del(key);
    }
}