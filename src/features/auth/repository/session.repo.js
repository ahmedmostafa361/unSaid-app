import { Session } from "../model/session.model.js";

export const createSession = async (data) => {
    return Session.create(data);
};

export const findActiveSession = async (sessionId) => {
    return Session.findOne({ _id: sessionId, expiresAt: { $gt: new Date() } });
};

export const rotateSession = async (sessionId, currentHash, { refreshTokenHash, expiresAt, ip, userAgent }) => {
    return Session.findOneAndUpdate(
        { _id: sessionId, refreshTokenHash: currentHash },
        { $set: { refreshTokenHash, expiresAt, ip, userAgent, lastUsedAt: new Date() } },
        { returnDocument: "after" }
    );
};

export const deleteSession = async (sessionId, userId) => {
    const filter = { _id: sessionId };
    if (userId) filter.user = userId;
    return Session.findOneAndDelete(filter);
};

export const deleteUserSessions = async (userId, { exceptSessionId } = {}) => {
    const filter = { user: userId };
    if (exceptSessionId) filter._id = { $ne: exceptSessionId };
    return Session.deleteMany(filter);
};

export const listUserSessions = async (userId) => {
    return Session.find({ user: userId, expiresAt: { $gt: new Date() } })
        .select("userAgent ip lastUsedAt createdAt expiresAt")
        .sort({ lastUsedAt: -1 })
        .lean();
};
