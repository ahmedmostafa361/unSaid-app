import { cacheProvider } from "./init.js";
import { logger } from "../../pkg/logger/logger.js";

const versionKey = (namespace) => `cache-version:${namespace}`;

export const cacheKeys = {
    publicProfile: (username) => `profile:${String(username).toLowerCase()}`,
    publicMessages: (username) => `public-messages:${String(username).toLowerCase()}`,
};

export async function getNamespaceVersion(namespace) {
    try {
        const version = await cacheProvider.get(versionKey(namespace));
        return Number(version) || 0;
    } catch (err) {
        logger.warn("Cache version read failed", { namespace, error: err.message });
        return null;
    }
}

export async function invalidateNamespace(...namespaces) {
    await Promise.all(
        namespaces.filter(Boolean).map(async (namespace) => {
            try {
                await cacheProvider.increment(versionKey(namespace));
            } catch (err) {
                logger.warn("Cache invalidation failed", { namespace, error: err.message });
            }
        })
    );
}

export async function invalidateUserCaches(...usernames) {
    const unique = [...new Set(usernames.filter(Boolean).map((name) => String(name).toLowerCase()))];
    await invalidateNamespace(
        ...unique.flatMap((username) => [cacheKeys.publicProfile(username), cacheKeys.publicMessages(username)])
    );
}
