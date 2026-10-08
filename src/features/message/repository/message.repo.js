import { Message } from "../model/message.model.js";

export const createMessage = async ({ content, receiver, sender }) => {
    return Message.create({ content, receiver, sender });
};