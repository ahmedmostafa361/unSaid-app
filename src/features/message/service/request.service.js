import * as messageRepository from "../repository/message.repo.js";
import * as requestRepository from "../repository/request.repo.js";
import * as conversationRepository from "../repository/conversation.repo.js";
import * as userRepository from "../../user/repository/user.repo.js";
import { IDENTITY_REQUEST_STATUS } from "../../../lib/config/constants.js";
import { sendEmailInBackground } from "../../../lib/email/init.js";
import { getIdentityRequestEmail } from "../../../lib/templates/emailTemplates.js";
import { buildPagination } from "../../../lib/utils/pagination.js";
import {
    guestSender,
    identityRequestAlreadyHandled,
    identityRequestExists,
    identityRequestNotFound,
    messageNotFound,
} from "../errors.js";

const toRequesterView = (request, sender) => ({
    _id: request._id,
    status: request.status,
    note: request.note,
    message: request.message,
    createdAt: request.createdAt,
    respondedAt: request.respondedAt,
    conversation: request.status === IDENTITY_REQUEST_STATUS.ACCEPTED ? request.conversation : null,
    sender: request.status === IDENTITY_REQUEST_STATUS.ACCEPTED ? sender ?? null : null,
});

const toSenderView = (request) => ({
    _id: request._id,
    status: request.status,
    note: request.note,
    message: request.message,
    requester: request.requester,
    createdAt: request.createdAt,
    respondedAt: request.respondedAt,
    conversation: request.conversation,
});

const notifySender = async (senderId) => {
    const sender = await userRepository.findUserById(senderId);
    if (!sender || sender.settings?.emailNotifications === false) return;
    const { subject, html } = getIdentityRequestEmail(sender.name);
    sendEmailInBackground(sender.email, subject, html);
};

export async function createIdentityRequest(userId, messageId, note = "") {
    const message = await messageRepository.findInboxMessage(userId, messageId, { withSender: true });
    if (!message) throw messageNotFound();
    if (!message.sender) throw guestSender();

    const existing = await requestRepository.findByMessage(messageId);
    if (existing) throw identityRequestExists(existing.status);

    let request;
    try {
        request = await requestRepository.createRequest({
            message: message._id,
            requester: userId,
            sender: message.sender,
            note,
        });
    } catch (error) {
        if (error.code === 11000) throw identityRequestExists(IDENTITY_REQUEST_STATUS.PENDING);
        throw error;
    }

    notifySender(message.sender).catch(() => {});

    return {
        _id: request._id,
        message: request.message,
        status: request.status,
        note: request.note,
        createdAt: request.createdAt,
    };
}

export async function getReceivedRequests(userId, { status, page, limit }) {
    const { requests, total } = await requestRepository.listForSender(userId, { status, page, limit });
    return {
        requests: requests.map(toSenderView),
        pagination: buildPagination(page, limit, total),
    };
}

export async function getSentRequests(userId, { status, page, limit }) {
    const { requests, total } = await requestRepository.listForRequester(userId, { status, page, limit });

    const acceptedSenderIds = requests
        .filter((request) => request.status === IDENTITY_REQUEST_STATUS.ACCEPTED)
        .map((request) => request.sender);
    const senders = acceptedSenderIds.length ? await userRepository.findPublicUsersByIds(acceptedSenderIds) : [];
    const senderById = new Map(senders.map((sender) => [String(sender._id), sender]));

    return {
        requests: requests.map((request) => toRequesterView(request, senderById.get(String(request.sender)))),
        pagination: buildPagination(page, limit, total),
    };
}

export async function getPendingCount(userId) {
    return { pending: await requestRepository.countPendingForSender(userId) };
}

const openConversation = async (request) => {
    try {
        return await conversationRepository.createConversation({
            participants: [request.sender, request.requester],
            message: request.message,
            identityRequest: request._id,
        });
    } catch (error) {
        if (error.code === 11000) return conversationRepository.findByMessage(request.message);
        throw error;
    }
};

export async function respondToRequest(userId, requestId, action) {
    const request = await requestRepository.findById(requestId);
    if (!request || String(request.sender) !== String(userId)) throw identityRequestNotFound();
    if (request.status !== IDENTITY_REQUEST_STATUS.PENDING) throw identityRequestAlreadyHandled(request.status);

    const status = action === "accept" ? IDENTITY_REQUEST_STATUS.ACCEPTED : IDENTITY_REQUEST_STATUS.REJECTED;
    const updated = await requestRepository.respond(requestId, userId, status);

    if (!updated) {
        const latest = await requestRepository.findById(requestId);
        throw identityRequestAlreadyHandled(latest?.status ?? status);
    }

    if (status === IDENTITY_REQUEST_STATUS.REJECTED) {
        return { request: toSenderView(updated), conversation: null };
    }

    const conversation = await openConversation(updated);
    const withConversation = await requestRepository.setConversation(requestId, conversation._id);

    return {
        request: toSenderView(withConversation),
        conversation: { _id: conversation._id, participants: conversation.participants, message: conversation.message },
    };
}
