import * as messageService from '../service/message.service.js';
import { sendMessageDto, getMessagesQueryDto } from "../dto/message.dto.js";
import { validateBody } from "../../../lib/validation/validation.js";

export const sendMessageController = async (req, res, next) => {
    try {
        // validate data
        const data = validateBody(sendMessageDto, req.body);
        const { content, receiverId } = data;

        // sender comes from the token, never from the body
        const sender = req.user?.userId;

        await messageService.sendMessage({ content, receiverId, sender });

        // don't return the sender: messages are anonymous
        res.status(201).json({
            message: "Message sent successfully",
            success: true,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllMessageController = async (req, res, next) => {
    try {
        // validate query params (?page=1&limit=20)
        const query = validateBody(getMessagesQueryDto, req.query);

        const { messages, pagination } = await messageService.getAllMessages(
            req.user.userId,
            query
        );

        res.status(200).json({
            message: "Messages fetched successfully",
            success: true,
            data: messages,
            pagination,
        });
    } catch (error) {
        next(error);
    }
};