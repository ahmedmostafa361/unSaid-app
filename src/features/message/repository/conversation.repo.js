import mongoose from "mongoose";
import { Conversation } from "../model/conversation.model.js";
import { ChatMessage } from "../model/chat.model.js";

const PARTICIPANT_FIELDS = "name username profilePicturePath isDeleted";
const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

export const createConversation = async (data) => {
    return Conversation.create(data);
};

export const findByMessage = async (messageId) => {
    return Conversation.findOne({ message: messageId }).lean();
};

export const findById = async (conversationId) => {
    return Conversation.findById(conversationId)
        .populate({ path: "participants", select: PARTICIPANT_FIELDS })
        .populate({ path: "message", select: "content createdAt" })
        .lean();
};

export const listForUser = async (userId, { page, limit }) => {
    const query = { participants: userId };

    const [conversations, total] = await Promise.all([
        Conversation.find(query)
            .populate({ path: "participants", select: PARTICIPANT_FIELDS })
            .populate({ path: "message", select: "content createdAt" })
            .sort({ lastActivityAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Conversation.countDocuments(query),
    ]);

    return { conversations, total };
};

export const unreadCountsFor = async (conversationIds, userId) => {
    if (conversationIds.length === 0) return new Map();

    const rows = await ChatMessage.aggregate([
        {
            $match: {
                conversation: { $in: conversationIds.map(toObjectId) },
                sender: { $ne: toObjectId(userId) },
                readAt: null,
                isDeleted: false,
            },
        },
        { $group: { _id: "$conversation", count: { $sum: 1 } } },
    ]);

    return new Map(rows.map((row) => [String(row._id), row.count]));
};

export const countUnreadForUser = async (userId) => {
    const conversations = await Conversation.find({ participants: userId }).select("_id").lean();
    if (conversations.length === 0) return 0;

    return ChatMessage.countDocuments({
        conversation: { $in: conversations.map((conversation) => conversation._id) },
        sender: { $ne: userId },
        readAt: null,
        isDeleted: false,
    });
};

export const updateLastMessage = async (conversationId, lastMessage) => {
    return Conversation.findByIdAndUpdate(conversationId, {
        $set: { lastMessage, lastActivityAt: lastMessage?.createdAt ?? new Date() },
    });
};

export const setLastMessageContentIfLatest = async (conversationId, createdAt, content) => {
    return Conversation.updateOne(
        { _id: conversationId, "lastMessage.createdAt": createdAt },
        { $set: { "lastMessage.content": content } }
    );
};

export const createChatMessage = async (data) => {
    return ChatMessage.create(data);
};

export const findChatMessage = async (conversationId, chatMessageId) => {
    return ChatMessage.findOne({ _id: chatMessageId, conversation: conversationId, isDeleted: false }).lean();
};

export const updateChatMessage = async (chatMessageId, update) => {
    return ChatMessage.findByIdAndUpdate(chatMessageId, { $set: update }, { returnDocument: "after" })
        .select("-__v")
        .lean();
};

export const listChatMessages = async (conversationId, { page, limit }) => {
    const query = { conversation: conversationId };

    const [messages, total] = await Promise.all([
        ChatMessage.find(query)
            .select("-__v")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        ChatMessage.countDocuments(query),
    ]);

    return { messages, total };
};

export const markConversationRead = async (conversationId, readerId) => {
    return ChatMessage.updateMany(
        { conversation: conversationId, sender: { $ne: readerId }, readAt: null },
        { $set: { readAt: new Date() } }
    );
};
