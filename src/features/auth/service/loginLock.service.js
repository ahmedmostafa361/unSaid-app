import { cacheProvider } from "../../../lib/cache/init.js";
import { AUTH_LIMITS } from "../../../lib/config/constants.js";
import { sendEmailInBackground } from "../../../lib/email/init.js";
import { getAccountLockedEmail } from "../../../lib/templates/emailTemplates.js";
import { toSeconds } from "../../../pkg/utils/time.js";

const failuresKey = (userId) => `auth:login-failures:${userId}`;
const lockKey = (userId) => `auth:login-lock:${userId}`;

export const getLockRemainingSeconds = async (userId) => {
    const ttl = await cacheProvider.ttl(lockKey(userId));
    if (ttl === -1) {
        await cacheProvider.expire(lockKey(userId), toSeconds(AUTH_LIMITS.lockMinutes, "minutes"));
        return toSeconds(AUTH_LIMITS.lockMinutes, "minutes");
    }
    return ttl > 0 ? ttl : 0;
};

export const registerFailedLogin = async (user) => {
    const userId = String(user._id);
    const attempts = await cacheProvider.increment(failuresKey(userId));

    if (attempts === 1) {
        await cacheProvider.expire(failuresKey(userId), toSeconds(AUTH_LIMITS.failedLoginsWindowHours, "hours"));
    }

    if (attempts >= AUTH_LIMITS.maxFailedLogins) {
        const lockSeconds = toSeconds(AUTH_LIMITS.lockMinutes, "minutes");
        await cacheProvider.set(lockKey(userId), 1, lockSeconds);
        await cacheProvider.delete(failuresKey(userId));

        if (user.settings?.emailNotifications !== false) {
            const { subject, html } = getAccountLockedEmail(user.name, AUTH_LIMITS.lockMinutes);
            sendEmailInBackground(user.email, subject, html);
        }

        return { locked: true, retryAfterSeconds: lockSeconds };
    }

    return { locked: false, attemptsLeft: AUTH_LIMITS.maxFailedLogins - attempts };
};

export const clearFailedLogins = async (userId) => {
    await cacheProvider.delete(failuresKey(String(userId)));
};

export const unlockAccount = async (userId) => {
    await cacheProvider.delete(failuresKey(String(userId)), lockKey(String(userId)));
};
