// redis.js
import { Redis } from "@upstash/redis";

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

    async setIfNotExists(key, value, ttl) {
        const result = await this.client.set(key, value, { nx: true, ex: ttl });
        return result === "OK";
    }

    async get(key) {
        return this.client.get(key);
    }

    async delete(...keys) {
        if (keys.length === 0) return 0;
        return this.client.del(...keys);
    }

    async increment(key) {
        return this.client.incr(key);
    }

    async expire(key, ttl) {
        return this.client.expire(key, ttl);
    }

    async ttl(key) {
        return this.client.ttl(key);
    }
}
