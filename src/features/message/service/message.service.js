import * as userRepository from "../../user/repository/user.repo.js";
import * as blockRepository from "../../user/repository/block.repo.js";
import * as messageRepository from "../repository/message.repo.js";
import * as requestRepository from "../repository/request.repo.js";
import * as reportRepository from "../repository/report.repo.js";
import { userNotExist } from "../../user/errors.js";
import {
    alreadyReported,
    cannotMessageSelf,
    cannotMessageUser,
    guestMessagesDisabled,
    guestSender,
    messageNotFound,
    receiverNotAcceptingMessages,
} from "../errors.js";
import { IDENTITY_REQUEST_STATUS } from "../../../lib/config/constants.js";
import { invalidateNamespace, cacheKeys } from "../../../lib/cache/cache.service.js";
import { buildPagination } from "../../../lib/utils/pagination.js";

const isSameId = (a, b) => a && b && String(a) === String(b);

const toInboxMessage = (message, request, revealedSender) => ({
    _id: message._id,
    content: message.content,
    isRead: message.isRead,
    readAt: message.readAt,
    isFavorite: message.isFavorite,
    isArchived: message.isArchived,
    isPublic: message.isPublic,
    publishedAt: message.publishedAt,
    reply: message.reply,
    createdAt: message.createdAt,
    canRequestIdentity: Boolean(message.sender) && !request,
    identityRequest: request
        ? { _id: request._id, status: request.status, conversation: request.conversation ?? null }
        : null,
    sender: revealedSender ?? null,
});

const buildInboxMessages = async (receiverId, messages) => {
    if (messages.length === 0) return [];

    const requests = await requestRepository.findByMessageIds(
        messages.map((message) => message._id),
        receiverId
    );
    const requestByMessage = new Map(requests.map((request) => [String(request.message), request]));

    const revealedSenderIds = messages
        .filter((message) => requestByMessage.get(String(message._id))?.status === IDENTITY_REQUEST_STATUS.ACCEPTED)
        .map((message) => message.sender);

    const senders = revealedSenderIds.length ? await userRepository.findPublicUsersByIds(revealedSenderIds) : [];
    const senderById = new Map(senders.map((sender) => [String(sender._id), sender]));

    return messages.map((message) => {
        const request = requestByMessage.get(String(message._id));
        const revealed =
            request?.status === IDENTITY_REQUEST_STATUS.ACCEPTED ? senderById.get(String(message.sender)) : null;
        return toInboxMessage(message, request, revealed);
    });
};

const resolveReceiver = async ({ receiverId, username }) => {
    const receiver = receiverId
        ? await userRepository.findUserById(receiverId)
        : await userRepository.findActiveUserByUsername(username);
    if (!receiver || !receiver.isVerified) throw userNotExist();
    return receiver;
};

export async function sendMessage({ content, receiverId, username, senderId, revealable = true }) {
    // 1. don't allow messaging yourself (remove if you want to allow it)
    if (isSameId(senderId, receiverId)) throw cannotMessageSelf();

    // 2. check receiver exists
    const receiver = await resolveReceiver({ receiverId, username });

    if (isSameId(senderId, receiver._id)) throw cannotMessageSelf();
    if (receiver.settings?.acceptMessages === false) throw receiverNotAcceptingMessages();

    const storedSender = senderId && revealable ? senderId : null;

    if (!storedSender && receiver.settings?.allowGuestMessages === false) throw guestMessagesDisabled();

    if (senderId && (await blockRepository.isBlocked(receiver._id, senderId))) throw cannotMessageUser();

    // 3. save message
    const message = await messageRepository.createMessage({
        content,
        receiver: receiver._id,
        sender: storedSender,
    });

    return {
        _id: message._id,
        receiver: { _id: receiver._id, username: receiver.username, name: receiver.name },
        createdAt: message.createdAt,
        canBeRevealed: Boolean(storedSender),
    };
}

export async function getInbox(userId, { filter, page, limit }) {
    const { messages, total } = await messageRepository.getInbox(userId, { filter, page, limit });
    return {
        messages: await buildInboxMessages(userId, messages),
        pagination: buildPagination(page, limit, total),
    };
}

export async function getAllMessages(userId, { page, limit }) {
    return getInbox(userId, { filter: "all", page, limit });
}

export async function getMessage(userId, messageId) {
    const message = await messageRepository.findInboxMessage(userId, messageId, { withSender: true });
    if (!message) throw messageNotFound();

    if (!message.isRead) {
        const updated = await messageRepository.markRead(userId, messageId, true);
        message.isRead = true;
        message.readAt = updated?.readAt ?? new Date();
    }

    const [built] = await buildInboxMessages(userId, [message]);
    return built;
}

export async function getUnreadCount(userId) {
    return { unread: await messageRepository.countUnread(userId) };
}

export async function markRead(userId, messageId, isRead) {
    const message = await messageRepository.markRead(userId, messageId, isRead);
    if (!message) throw messageNotFound();
    return { _id: message._id, isRead: message.isRead, readAt: message.readAt };
}

export async function markAllRead(userId) {
    const result = await messageRepository.markAllRead(userId);
    return { updated: result.modifiedCount };
}

export async function toggleFavorite(userId, messageId) {
    const message = await messageRepository.toggleFlag(userId, messageId, "isFavorite");
    if (!message) throw messageNotFound();
    return { _id: message._id, isFavorite: message.isFavorite };
}

export async function toggleArchive(userId, messageId) {
    const message = await messageRepository.toggleFlag(userId, messageId, "isArchived");
    if (!message) throw messageNotFound();
    return { _id: message._id, isArchived: message.isArchived };
}

export async function deleteMessage(userId, username, messageId) {
    const message = await messageRepository.softDeleteMessage(userId, messageId);
    if (!message) throw messageNotFound();
    if (message.isPublic) {
        await invalidateNamespace(cacheKeys.publicMessages(username), cacheKeys.publicProfile(username));
    }
}

export async function publishMessage(userId, username, messageId, reply) {
    const message = await messageRepository.publishMessage(userId, messageId, reply);
    if (!message) throw messageNotFound();
    await invalidateNamespace(cacheKeys.publicMessages(username), cacheKeys.publicProfile(username));
    return { _id: message._id, isPublic: message.isPublic, publishedAt: message.publishedAt, reply: message.reply };
}

export async function unpublishMessage(userId, username, messageId) {
    const message = await messageRepository.unpublishMessage(userId, messageId);
    if (!message) throw messageNotFound();
    await invalidateNamespace(cacheKeys.publicMessages(username), cacheKeys.publicProfile(username));
    return { _id: message._id, isPublic: message.isPublic };
}

export async function getPublicMessages(username, { page, limit }) {
    const user = await userRepository.findActiveUserByUsername(username);
    if (!user) throw userNotExist();

    if (user.settings?.showPublicMessages === false) {
        return { messages: [], pagination: buildPagination(page, limit, 0) };
    }

    const { messages, total } = await messageRepository.getPublicMessages(user._id, { page, limit });
    return { messages, pagination: buildPagination(page, limit, total) };
}

export async function getSentMessages(userId, { page, limit }) {
    const { messages, total } = await messageRepository.getSentMessages(userId, { page, limit });

    const requests = messages.length
        ? await requestRepository.findByMessageIdsForSender(
              messages.map((message) => message._id),
              userId
          )
        : [];
    const requestByMessage = new Map(requests.map((request) => [String(request.message), request]));

    return {
        messages: messages.map((message) => {
            const request = requestByMessage.get(String(message._id));
            return {
                _id: message._id,
                content: message.content,
                receiver: message.receiver,
                createdAt: message.createdAt,
                identityRequest: request ? { _id: request._id, status: request.status } : null,
            };
        }),
        pagination: buildPagination(page, limit, total),
    };
}

export async function reportMessage(userId, messageId, { reason, details }) {
    const message = await messageRepository.findInboxMessage(userId, messageId);
    if (!message) throw messageNotFound();

    try {
        const report = await reportRepository.createReport({ message: messageId, reporter: userId, reason, details });
        return { _id: report._id, reason: report.reason, status: report.status };
    } catch (error) {
        if (error.code === 11000) throw alreadyReported();
        throw error;
    }
}

export async function blockSender(userId, messageId) {
    const message = await messageRepository.findInboxMessage(userId, messageId, { withSender: true });
    if (!message) throw messageNotFound();
    if (!message.sender) throw guestSender();

    const request = await requestRepository.findByMessage(messageId);
    const identityRevealed = request?.status === IDENTITY_REQUEST_STATUS.ACCEPTED;

    const block = await blockRepository.upsertBlock({
        blocker: userId,
        blocked: message.sender,
        fromMessage: message._id,
        isAnonymous: !identityRevealed,
    });

    return { blockId: block._id };
}
