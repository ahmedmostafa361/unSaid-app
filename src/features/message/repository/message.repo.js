import { Message } from "../model/message.model.js";

export const createMessage = async ({ content, receiver, sender }) => {
    return Message.create({ content, receiver, sender });
};

export const getAllMessagesByUserId = async (userId, { page, limit }) => {
    const filter = { receiver: userId, isDeleted: false };

    const [messages, total] = await Promise.all([
        Message.find(filter)
            .select("-isDeleted -__v")
            .populate({
                path: "sender",
                select: "name email", // whitelist: only these fields are returned
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Message.countDocuments(filter),
    ]);

    return { messages, total };
};