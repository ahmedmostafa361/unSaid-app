import * as messageService from "../service/message.service.js";
import { validateBody } from "../../../lib/validation/validation.js";
import {
    getMessagesQueryDto,
    markReadDto,
    messageIdParamsDto,
    paginationDto,
    publishMessageDto,
    reportMessageDto,
    sendMessageDto,
    usernameParamsDto,
} from "../dto/message.dto.js";

const send = (revealable) => async (req, res) => {
    // validate data
    const { content, receiverId, username } = validateBody(sendMessageDto, req.body);

    const data = await messageService.sendMessage({
        content,
        receiverId,
        username,
        // sender comes from the token, never from the body
        senderId: req.user?.userId,
        revealable,
    });

    // don't return the sender: messages are anonymous
    res.status(201).json({
        message: "Message sent successfully",
        success: true,
        data,
    });
};

export const sendMessageController = send(true);

export const sendAnonymousMessageController = send(false);

export const getAllMessageController = async (req, res) => {
    // validate query params (?page=1&limit=20)
    const query = validateBody(getMessagesQueryDto, req.query);
    const { messages, pagination } = await messageService.getInbox(req.user.userId, query);
    res.status(200).json({
        message: "Messages fetched successfully",
        success: true,
        data: messages,
        pagination,
    });
};

export const getMessageController = async (req, res) => {
    const { messageId } = validateBody(messageIdParamsDto, req.params);
    const message = await messageService.getMessage(req.user.userId, messageId);
    res.status(200).json({ message: "Message fetched successfully", success: true, data: message });
};

export const getUnreadCountController = async (req, res) => {
    const data = await messageService.getUnreadCount(req.user.userId);
    res.status(200).json({ message: "Unread messages count", success: true, data });
};

export const markReadController = async (req, res) => {
    const { messageId } = validateBody(messageIdParamsDto, req.params);
    const { isRead } = validateBody(markReadDto, req.body);
    const data = await messageService.markRead(req.user.userId, messageId, isRead);
    res.status(200).json({ message: isRead ? "Marked as read" : "Marked as unread", success: true, data });
};

export const markAllReadController = async (req, res) => {
    const data = await messageService.markAllRead(req.user.userId);
    res.status(200).json({ message: "All messages marked as read", success: true, data });
};

export const toggleFavoriteController = async (req, res) => {
    const { messageId } = validateBody(messageIdParamsDto, req.params);
    const data = await messageService.toggleFavorite(req.user.userId, messageId);
    res.status(200).json({
        message: data.isFavorite ? "Added to favorites" : "Removed from favorites",
        success: true,
        data,
    });
};

export const toggleArchiveController = async (req, res) => {
    const { messageId } = validateBody(messageIdParamsDto, req.params);
    const data = await messageService.toggleArchive(req.user.userId, messageId);
    res.status(200).json({ message: data.isArchived ? "Archived" : "Moved to inbox", success: true, data });
};

export const deleteMessageController = async (req, res) => {
    const { messageId } = validateBody(messageIdParamsDto, req.params);
    await messageService.deleteMessage(req.user.userId, req.user.username, messageId);
    res.status(200).json({ message: "Message deleted", success: true });
};

export const publishMessageController = async (req, res) => {
    const { messageId } = validateBody(messageIdParamsDto, req.params);
    const { reply } = validateBody(publishMessageDto, req.body);
    const data = await messageService.publishMessage(req.user.userId, req.user.username, messageId, reply);
    res.status(200).json({ message: "Message is now public on your profile", success: true, data });
};

export const unpublishMessageController = async (req, res) => {
    const { messageId } = validateBody(messageIdParamsDto, req.params);
    const data = await messageService.unpublishMessage(req.user.userId, req.user.username, messageId);
    res.status(200).json({ message: "Message removed from your profile", success: true, data });
};

export const getPublicMessagesController = async (req, res) => {
    const { username } = validateBody(usernameParamsDto, req.params);
    const query = validateBody(paginationDto, req.query);
    const { messages, pagination } = await messageService.getPublicMessages(username, query);
    res.status(200).json({ message: "Public messages", success: true, data: messages, pagination });
};

export const getSentMessagesController = async (req, res) => {
    const query = validateBody(paginationDto, req.query);
    const { messages, pagination } = await messageService.getSentMessages(req.user.userId, query);
    res.status(200).json({ message: "Sent messages", success: true, data: messages, pagination });
};

export const reportMessageController = async (req, res) => {
    const { messageId } = validateBody(messageIdParamsDto, req.params);
    const body = validateBody(reportMessageDto, req.body);
    const data = await messageService.reportMessage(req.user.userId, messageId, body);
    res.status(201).json({ message: "Thanks, we received your report", success: true, data });
};

export const blockSenderController = async (req, res) => {
    const { messageId } = validateBody(messageIdParamsDto, req.params);
    const data = await messageService.blockSender(req.user.userId, messageId);
    res.status(200).json({
        message: "Sender blocked. They can no longer message you, and their identity stays hidden",
        success: true,
        data,
    });
};
