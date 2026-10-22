import * as conversationRepository from "../repository/conversation.repo.js";
import * as blockRepository from "../../user/repository/block.repo.js";
import { buildPagination } from "../../../lib/utils/pagination.js";
import {
    cannotMessageUser,
    chatMessageNotFound,
    conversationBlocked,
    conversationNotFound,
    notChatMessageOwner,
    notConversationParticipant,
} from "../errors.js";

const DELETED_MESSAGE_TEXT = "This message was deleted";

const toParticipant = (user) => {
    if (!user) return null;
    if (user.isDeleted) return { _id: user._id, name: "Deleted user", username: null, profilePicturePath: null };
    return { _id: user._id, name: user.name, username: user.username, profilePicturePath: user.profilePicturePath };
};

const otherParticipant = (conversation, userId) =>
    conversation.participants.find((participant) => String(participant._id) !== String(userId));

const toConversationView = (conversation, userId, extras = {}) => ({
    _id: conversation._id,
    otherUser: toParticipant(otherParticipant(conversation, userId)),
    originalMessage: conversation.message,
    lastMessage: conversation.lastMessage,
    lastActivityAt: conversation.lastActivityAt,
    createdAt: conversation.createdAt,
    ...extras,
});

const toChatMessageView = (message) => ({
    _id: message._id,
    conversation: message.conversation,
    sender: message.sender,
    content: message.isDeleted ? null : message.content,
    isEdited: message.isEdited,
    isDeleted: message.isDeleted,
    readAt: message.readAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
});

const getParticipantConversation = async (userId, conversationId) => {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw conversationNotFound();

    const isParticipant = conversation.participants.some(
        (participant) => String(participant._id) === String(userId)
    );
    if (!isParticipant) throw notConversationParticipant();

    return conversation;
};

const getOwnChatMessage = async (userId, conversationId, chatMessageId) => {
    const message = await conversationRepository.findChatMessage(conversationId, chatMessageId);
    if (!message) throw chatMessageNotFound();
    if (String(message.sender) !== String(userId)) throw notChatMessageOwner();
    return message;
};

export async function listConversations(userId, { page, limit }) {
    const { conversations, total } = await conversationRepository.listForUser(userId, { page, limit });
    const unread = await conversationRepository.unreadCountsFor(
        conversations.map((conversation) => conversation._id),
        userId
    );

    return {
        conversations: conversations.map((conversation) =>
            toConversationView(conversation, userId, { unreadCount: unread.get(String(conversation._id)) ?? 0 })
        ),
        pagination: buildPagination(page, limit, total),
    };
}

export async function getConversation(userId, conversationId) {
    const conversation = await getParticipantConversation(userId, conversationId);
    const other = otherParticipant(conversation, userId);
    const [isBlocked, unread] = await Promise.all([
        other ? blockRepository.isEitherBlocked(userId, other._id) : true,
        conversationRepository.unreadCountsFor([conversation._id], userId),
    ]);

    return toConversationView(conversation, userId, {
        unreadCount: unread.get(String(conversation._id)) ?? 0,
        canSendMessages: Boolean(other) && !isBlocked && !other.isDeleted,
    });
}

export async function sendChatMessage(userId, conversationId, content) {
    const conversation = await getParticipantConversation(userId, conversationId);
    const other = otherParticipant(conversation, userId);

    if (!other || other.isDeleted) throw cannotMessageUser();
    if (await blockRepository.isEitherBlocked(userId, other._id)) throw conversationBlocked();

    const message = await conversationRepository.createChatMessage({
        conversation: conversation._id,
        sender: userId,
        content,
    });

    await conversationRepository.updateLastMessage(conversation._id, {
        content: message.content,
        sender: message.sender,
        createdAt: message.createdAt,
    });

    return toChatMessageView(message.toObject());
}

export async function getChatMessages(userId, conversationId, { page, limit }) {
    const conversation = await getParticipantConversation(userId, conversationId);

    const [{ messages, total }] = await Promise.all([
        conversationRepository.listChatMessages(conversation._id, { page, limit }),
        conversationRepository.markConversationRead(conversation._id, userId),
    ]);

    return {
        messages: messages.map(toChatMessageView),
        pagination: buildPagination(page, limit, total),
    };
}

export async function editChatMessage(userId, conversationId, chatMessageId, content) {
    await getParticipantConversation(userId, conversationId);
    const message = await getOwnChatMessage(userId, conversationId, chatMessageId);

    const updated = await conversationRepository.updateChatMessage(message._id, { content, isEdited: true });
    await conversationRepository.setLastMessageContentIfLatest(conversationId, message.createdAt, content);

    return toChatMessageView(updated);
}

export async function deleteChatMessage(userId, conversationId, chatMessageId) {
    await getParticipantConversation(userId, conversationId);
    const message = await getOwnChatMessage(userId, conversationId, chatMessageId);

    await conversationRepository.updateChatMessage(message._id, { isDeleted: true, deletedAt: new Date() });
    await conversationRepository.setLastMessageContentIfLatest(conversationId, message.createdAt, DELETED_MESSAGE_TEXT);
}
