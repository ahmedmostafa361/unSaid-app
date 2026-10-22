import mongoose from "mongoose";
import * as sessionRepository from "../repository/session.repo.js";
import * as userRepository from "../../user/repository/user.repo.js";
import { env } from "../../../lib/config/env.js";
import { generateRandomToken, generateToken } from "../../../pkg/utils/token.js";
import { safeEqual, sha256 } from "../../../pkg/utils/hash.js";
import { addTime } from "../../../pkg/utils/time.js";
import { logger } from "../../../pkg/logger/logger.js";
import { invalidRefreshToken } from "../errors.js";

const accessTokenTtlSeconds = () => env.accessTokenExpiresMinutes * 60;

const buildTokens = (user, sessionId, refreshToken, refreshTokenExpiresAt) => ({
    accessToken: generateToken(
        { sub: String(user._id), sid: String(sessionId), role: user.role, type: "access" },
        env.jwtSecret,
        accessTokenTtlSeconds()
    ),
    refreshToken,
    tokenType: "Bearer",
    accessTokenExpiresIn: accessTokenTtlSeconds(),
    refreshTokenExpiresAt,
});

const trimMeta = (meta = {}) => ({
    ip: meta.ip ?? null,
    userAgent: meta.userAgent ? String(meta.userAgent).slice(0, 512) : null,
});

export const createSessionTokens = async (user, meta) => {
    const sessionId = new mongoose.Types.ObjectId();
    const secret = generateRandomToken();
    const expiresAt = addTime(env.refreshTokenExpiresDays, "days");

    await sessionRepository.createSession({
        _id: sessionId,
        user: user._id,
        refreshTokenHash: sha256(secret),
        expiresAt,
        ...trimMeta(meta),
    });

    return buildTokens(user, sessionId, `${sessionId}.${secret}`, expiresAt);
};

export const rotateRefreshToken = async (refreshToken, meta) => {
    const [sessionId, secret] = String(refreshToken ?? "").split(".");
    if (!sessionId || !secret || !/^[0-9a-f]{24}$/i.test(sessionId)) throw invalidRefreshToken();

    const session = await sessionRepository.findActiveSession(sessionId);
    if (!session) throw invalidRefreshToken();

    const currentHash = sha256(secret);
    if (!safeEqual(currentHash, session.refreshTokenHash)) {
        await sessionRepository.deleteSession(sessionId);
        logger.warn("Refresh token reuse detected, session revoked", { sessionId, userId: String(session.user) });
        throw invalidRefreshToken();
    }

    const user = await userRepository.findUserById(session.user);
    if (!user) {
        await sessionRepository.deleteSession(sessionId);
        throw invalidRefreshToken();
    }

    const newSecret = generateRandomToken();
    const expiresAt = addTime(env.refreshTokenExpiresDays, "days");

    const rotated = await sessionRepository.rotateSession(sessionId, currentHash, {
        refreshTokenHash: sha256(newSecret),
        expiresAt,
        ...trimMeta(meta),
    });
    if (!rotated) throw invalidRefreshToken();

    return buildTokens(user, sessionId, `${sessionId}.${newSecret}`, expiresAt);
};
