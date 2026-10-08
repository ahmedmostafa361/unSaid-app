import * as userRepository from "../../user/repository/user.repo.js";
import * as messageRepository from "../repository/message.repo.js";
import { userNotExist } from "../../user/errors.js";
import { cannotMessageSelf } from "../errors.js";
import {AppError} from "../../../lib/errors/error.js";

export async function sendMessage({ content, receiverId, sender }) {
    // 1. don't allow messaging yourself (remove if you want to allow it)
    if (sender && receiverId.toString() === sender.toString()) {
        throw cannotMessageSelf;
    }

    // 2. check receiver exists
    const user = await userRepository.findUserById(receiverId);
    if (!user) throw userNotExist;

    // 3. save message
    return messageRepository.createMessage({ content, receiver: receiverId, sender });
}

export async function getAllMessages(userId, { page, limit }) {
    const { messages, total } = await messageRepository.getAllMessagesByUserId(userId, { page, limit });

    return {
        messages: messages.map((m) => ({ ...m, sender: m.sender ?? null })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}