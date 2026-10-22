import * as conversationService from "../service/conversation.service.js";
import { validateBody } from "../../../lib/validation/validation.js";
import {
    chatMessageDto,
    chatMessageParamsDto,
    conversationIdParamsDto,
    paginationDto,
} from "../dto/message.dto.js";

export const listConversationsController = async (req, res) => {
    const query = validateBody(paginationDto, req.query);
    const { conversations, pagination } = await conversationService.listConversations(req.user.userId, query);
    res.status(200).json({ message: "Conversations", success: true, data: conversations, pagination });
};

export const getConversationController = async (req, res) => {
    const { conversationId } = validateBody(conversationIdParamsDto, req.params);
    const data = await conversationService.getConversation(req.user.userId, conversationId);
    res.status(200).json({ message: "Conversation", success: true, data });
};

export const sendChatMessageController = async (req, res) => {
    const { conversationId } = validateBody(conversationIdParamsDto, req.params);
    const { content } = validateBody(chatMessageDto, req.body);
    const data = await conversationService.sendChatMessage(req.user.userId, conversationId, content);
    res.status(201).json({ message: "Message sent", success: true, data });
};

export const getChatMessagesController = async (req, res) => {
    const { conversationId } = validateBody(conversationIdParamsDto, req.params);
    const query = validateBody(paginationDto, req.query);
    const { messages, pagination } = await conversationService.getChatMessages(
        req.user.userId,
        conversationId,
        query
    );
    res.status(200).json({ message: "Conversation messages", success: true, data: messages, pagination });
};

export const editChatMessageController = async (req, res) => {
    const { conversationId, chatMessageId } = validateBody(chatMessageParamsDto, req.params);
    const { content } = validateBody(chatMessageDto, req.body);
    const data = await conversationService.editChatMessage(req.user.userId, conversationId, chatMessageId, content);
    res.status(200).json({ message: "Message edited", success: true, data });
};

export const deleteChatMessageController = async (req, res) => {
    const { conversationId, chatMessageId } = validateBody(chatMessageParamsDto, req.params);
    await conversationService.deleteChatMessage(req.user.userId, conversationId, chatMessageId);
    res.status(200).json({ message: "Message deleted", success: true });
};
