import * as userRepository from "../repository/user.repo.js";
import * as blockRepository from "../repository/block.repo.js";
import * as sessionRepository from "../../auth/repository/session.repo.js";
import * as messageRepository from "../../message/repository/message.repo.js";
import * as conversationRepository from "../../message/repository/conversation.repo.js";
import * as requestRepository from "../../message/repository/request.repo.js";
import { invalidateUserCaches } from "../../../lib/cache/cache.service.js";
import { sendEmailInBackground } from "../../../lib/email/init.js";
import { getPasswordChangedEmail } from "../../../lib/templates/emailTemplates.js";
import { toDiskPath, toPublicPath } from "../../../lib/media/multer.js";
import { buildPagination } from "../../../lib/utils/pagination.js";
import { randomUsernameFrom } from "../../../lib/utils/username.js";
import { comparePassword, hashPassword } from "../../../pkg/utils/hash.js";
import { removeFile, removeFiles } from "../../../pkg/utils/files.js";
import { escapeRegex } from "../../../pkg/utils/string.js";
import {
    blockNotFound,
    cannotBlockSelf,
    invalidCurrentPassword,
    passwordRequired,
    samePassword,
    userNotExist,
    usernameTaken,
} from "../errors.js";

export const generateUniqueUsername = async (source) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = randomUsernameFrom(source);
        if (!(await userRepository.usernameExists(candidate))) return candidate;
    }
    return `user${Date.now().toString(36)}`;
};

export const ensureUsername = async (user) => {
    if (user.username) return user;
    const username = await generateUniqueUsername(user.name || user.email.split("@")[0]);
    return userRepository.updateUserById(user._id, { username });
};

const toPublicProfile = (user, publicMessagesCount) => ({
    _id: user._id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    profilePicturePath: user.profilePicturePath,
    coverImagePath: user.coverImagePath,
    joinedAt: user.createdAt,
    acceptsMessages: user.settings?.acceptMessages !== false,
    acceptsGuestMessages: user.settings?.acceptMessages !== false && user.settings?.allowGuestMessages !== false,
    ...(user.settings?.showPublicMessages !== false ? { publicMessagesCount } : {}),
});

const getActiveUser = async (userId) => {
    const user = await userRepository.findUserById(userId);
    if (!user) throw userNotExist();
    return user;
};

export const getMe = async (userId) => {
    const user = await ensureUsername(await getActiveUser(userId));
    const [inbox, unreadChats, pendingIdentityRequests] = await Promise.all([
        messageRepository.getInboxStats(userId),
        conversationRepository.countUnreadForUser(userId),
        requestRepository.countPendingForSender(userId),
    ]);
    return { ...user.toJSON(), stats: { inbox, unreadChats, pendingIdentityRequests } };
};

export const getPublicProfile = async (username) => {
    const user = await userRepository.findActiveUserByUsername(username);
    if (!user) throw userNotExist();
    const publicMessagesCount = await messageRepository.countPublicMessages(user._id);
    return toPublicProfile(user, publicMessagesCount);
};

export const updateProfile = async (userId, data) => {
    const user = await getActiveUser(userId);

    if (data.username && data.username !== user.username) {
        if (await userRepository.usernameExists(data.username, userId)) throw usernameTaken();
    }

    const updated = await userRepository.updateUserById(userId, data);
    await invalidateUserCaches(user.username, updated.username);
    return updated;
};

export const updateSettings = async (userId, settings) => {
    const user = await getActiveUser(userId);
    const update = Object.fromEntries(Object.entries(settings).map(([key, value]) => [`settings.${key}`, value]));
    const updated = await userRepository.updateUserById(userId, { $set: update });
    await invalidateUserCaches(user.username);
    return updated.settings;
};

export const changePassword = async (userId, sessionId, { currentPassword, newPassword }) => {
    const user = await userRepository.findUserByIdWithPassword(userId);
    if (!user) throw userNotExist();

    if (user.password) {
        if (!currentPassword) throw passwordRequired();
        if (!(await comparePassword(currentPassword, user.password))) throw invalidCurrentPassword();
        if (await comparePassword(newPassword, user.password)) throw samePassword();
    }

    await userRepository.updateUserById(userId, {
        password: await hashPassword(newPassword),
        passwordChangedAt: new Date(),
    });

    const result = await sessionRepository.deleteUserSessions(userId, { exceptSessionId: sessionId });

    if (user.settings?.emailNotifications !== false) {
        const { subject, html } = getPasswordChangedEmail(user.name);
        sendEmailInBackground(user.email, subject, html);
    }

    return { otherSessionsRevoked: result.deletedCount };
};

export const deleteAccount = async (userId, password) => {
    const user = await userRepository.findUserByIdWithPassword(userId);
    if (!user) throw userNotExist();

    if (user.password) {
        if (!password) throw passwordRequired();
        if (!(await comparePassword(password, user.password))) throw invalidCurrentPassword();
    }

    const deletedAt = new Date();
    await userRepository.updateUserById(userId, { isDeleted: true, deletedAt });
    await sessionRepository.deleteUserSessions(userId);
    await invalidateUserCaches(user.username);
    return { deletedAt };
};

export const uploadProfilePictureService = async (userId, file) => {
    // 1. Get user with await
    const user = await userRepository.findUserById(userId);
    if (!user) {
        await removeFile(file.path);
        throw userNotExist(); // Called as a factory function to get fresh stack trace
    }

    // 2. Delete old image from server if it exists
    await removeFile(toDiskPath(user.profilePicturePath));

    // 3. Update new image path matching schema property
    const profilePicturePath = toPublicPath(file.path);
    await userRepository.updateUserById(userId, { profilePicturePath });
    await invalidateUserCaches(user.username);
    return { profilePicturePath };
};

export const removeProfilePicture = async (userId) => {
    const user = await getActiveUser(userId);
    await userRepository.updateUserById(userId, { profilePicturePath: null });
    await removeFile(toDiskPath(user.profilePicturePath));
    await invalidateUserCaches(user.username);
};

export const uploadCoverImages = async (userId, files) => {
    const user = await userRepository.findUserById(userId);
    if (!user) {
        await removeFiles(files.map((file) => file.path));
        throw userNotExist();
    }

    const coverImagePath = files.map((file) => toPublicPath(file.path));
    await userRepository.updateUserById(userId, { coverImagePath });
    await removeFiles((user.coverImagePath ?? []).map(toDiskPath));
    await invalidateUserCaches(user.username);
    return { coverImagePath };
};

export const uploadCv = async (userId, file) => {
    const user = await userRepository.findUserById(userId);
    if (!user) {
        await removeFile(file.path);
        throw userNotExist();
    }

    const cvPath = toPublicPath(file.path);
    await userRepository.updateUserById(userId, { cvPath });
    await removeFile(toDiskPath(user.cvPath));
    return { cvPath };
};

export const searchUsers = async (query, viewerId, { page, limit }) => {
    const excludeIds = viewerId ? [viewerId, ...(await blockRepository.findUserIdsWhoBlocked(viewerId))] : [];
    const { users, total } = await userRepository.searchUsers({
        query: escapeRegex(query),
        excludeIds,
        page,
        limit,
    });
    return { users, pagination: buildPagination(page, limit, total) };
};

export const blockUser = async (userId, targetId) => {
    if (String(userId) === String(targetId)) throw cannotBlockSelf();
    await getActiveUser(targetId);
    await blockRepository.upsertBlock({ blocker: userId, blocked: targetId });
};

export const unblockUser = async (userId, targetId) => {
    const removed = await blockRepository.deleteBlock(userId, targetId);
    if (!removed) throw blockNotFound();
};

export const removeBlockById = async (userId, blockId) => {
    const removed = await blockRepository.deleteBlockById(userId, blockId);
    if (!removed) throw blockNotFound();
};

export const getBlockedUsers = async (userId, { page, limit }) => {
    const { blocks, total } = await blockRepository.findBlocksByBlocker(userId, { page, limit });

    const items = blocks.map((block) => ({
        _id: block._id,
        blockedAt: block.createdAt,
        isAnonymous: block.isAnonymous,
        user: block.isAnonymous ? null : block.blocked,
        message: block.fromMessage ? { _id: block.fromMessage._id, content: block.fromMessage.content } : null,
    }));

    return { blocks: items, pagination: buildPagination(page, limit, total) };
};

export const listUsers = async ({ page, limit, includeDeleted }) => {
    const { users, total } = await userRepository.listUsers({ page, limit, includeDeleted });
    return { users, pagination: buildPagination(page, limit, total) };
};
