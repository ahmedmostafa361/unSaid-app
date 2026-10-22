import mongoose from "mongoose";
import { Message } from "../model/message.model.js";

const INBOX_FILTERS = {
    all: { isArchived: false },
    unread: { isArchived: false, isRead: false },
    favorites: { isFavorite: true },
    archived: { isArchived: true },
    public: { isPublic: true },
};

const INBOX_FIELDS = "-__v -isDeleted -deletedAt";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

export const createMessage = async ({ content, receiver, sender }) => {
    return Message.create({ content, receiver, sender });
};

export const findInboxMessage = async (receiverId, messageId, { withSender = false } = {}) => {
    return Message.findOne({ _id: messageId, receiver: receiverId, isDeleted: false })
        .select(withSender ? `${INBOX_FIELDS} +sender` : INBOX_FIELDS)
        .lean();
};

export const getInbox = async (receiverId, { filter = "all", page, limit }) => {
    const query = { receiver: receiverId, isDeleted: false, ...INBOX_FILTERS[filter] };

    const [messages, total] = await Promise.all([
        Message.find(query)
            .select(`${INBOX_FIELDS} +sender`)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Message.countDocuments(query),
    ]);

    return { messages, total };
};

export const markRead = async (receiverId, messageId, isRead = true) => {
    const update = isRead
        ? [{ $set: { isRead: true, readAt: { $ifNull: ["$readAt", "$$NOW"] } } }]
        : { $set: { isRead: false, readAt: null } };

    return Message.findOneAndUpdate({ _id: messageId, receiver: receiverId, isDeleted: false }, update, {
        returnDocument: "after",
        updatePipeline: true,
    })
        .select(INBOX_FIELDS)
        .lean();
};

export const markAllRead = async (receiverId) => {
    return Message.updateMany(
        { receiver: receiverId, isDeleted: false, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
    );
};

export const toggleFlag = async (receiverId, messageId, field) => {
    return Message.findOneAndUpdate(
        { _id: messageId, receiver: receiverId, isDeleted: false },
        [{ $set: { [field]: { $not: [`$${field}`] } } }],
        { returnDocument: "after", updatePipeline: true }
    )
        .select(INBOX_FIELDS)
        .lean();
};

export const softDeleteMessage = async (receiverId, messageId) => {
    return Message.findOneAndUpdate(
        { _id: messageId, receiver: receiverId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date(), isPublic: false } },
        { returnDocument: "before" }
    ).lean();
};

export const publishMessage = async (receiverId, messageId, reply) => {
    const set = { isPublic: true, publishedAt: new Date() };
    if (reply) set.reply = { content: reply, repliedAt: new Date() };

    return Message.findOneAndUpdate({ _id: messageId, receiver: receiverId, isDeleted: false }, { $set: set }, {
        returnDocument: "after",
        runValidators: true,
    })
        .select(INBOX_FIELDS)
        .lean();
};

export const unpublishMessage = async (receiverId, messageId) => {
    return Message.findOneAndUpdate(
        { _id: messageId, receiver: receiverId, isDeleted: false },
        { $set: { isPublic: false, publishedAt: null } },
        { returnDocument: "after" }
    )
        .select(INBOX_FIELDS)
        .lean();
};

export const getPublicMessages = async (receiverId, { page, limit }) => {
    const query = { receiver: receiverId, isPublic: true, isDeleted: false };

    const [messages, total] = await Promise.all([
        Message.find(query)
            .select("content reply publishedAt createdAt")
            .sort({ publishedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Message.countDocuments(query),
    ]);

    return { messages, total };
};

export const countPublicMessages = async (receiverId) => {
    return Message.countDocuments({ receiver: receiverId, isPublic: true, isDeleted: false });
};

export const getInboxStats = async (receiverId) => {
    const [stats] = await Message.aggregate([
        { $match: { receiver: toObjectId(receiverId), isDeleted: false } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                unread: { $sum: { $cond: [{ $and: [{ $eq: ["$isRead", false] }, { $eq: ["$isArchived", false] }] }, 1, 0] } },
                favorites: { $sum: { $cond: ["$isFavorite", 1, 0] } },
                archived: { $sum: { $cond: ["$isArchived", 1, 0] } },
                public: { $sum: { $cond: ["$isPublic", 1, 0] } },
            },
        },
    ]);

    return {
        total: stats?.total ?? 0,
        unread: stats?.unread ?? 0,
        favorites: stats?.favorites ?? 0,
        archived: stats?.archived ?? 0,
        public: stats?.public ?? 0,
    };
};

export const countUnread = async (receiverId) => {
    return Message.countDocuments({ receiver: receiverId, isDeleted: false, isArchived: false, isRead: false });
};

export const getSentMessages = async (senderId, { page, limit }) => {
    const query = { sender: senderId };

    const [messages, total] = await Promise.all([
        Message.find(query)
            .select("content receiver createdAt")
            .populate({ path: "receiver", select: "name username profilePicturePath" })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Message.countDocuments(query),
    ]);

    return { messages, total };
};
