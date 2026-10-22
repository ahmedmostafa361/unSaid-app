import { z } from "zod";
import { objectId, paginationDto, usernameSchema } from "../../../lib/validation/validation.js";
import { IDENTITY_REQUEST_STATUS, REPORT_REASONS } from "../../../lib/config/constants.js";

export const sendMessageDto = z
    .object({
        content: z.string().trim().min(1).max(200),
        receiverId: objectId("receiver id").optional(),
        username: usernameSchema.optional(),
    })
    .refine((data) => Boolean(data.receiverId) !== Boolean(data.username), {
        message: "Send either receiverId or username",
        path: ["receiverId"],
    });

export const getMessagesQueryDto = paginationDto.extend({
    filter: z.enum(["all", "unread", "favorites", "archived", "public"]).default("all"),
});

export const messageIdParamsDto = z.object({
    messageId: objectId("message id"),
});

export const usernameParamsDto = z.object({
    username: usernameSchema,
});

export const markReadDto = z.object({
    isRead: z.boolean().default(true),
});

export const publishMessageDto = z.object({
    reply: z.string().trim().min(1).max(300).optional(),
});

export const reportMessageDto = z.object({
    reason: z.enum(REPORT_REASONS),
    details: z.string().trim().max(500).optional(),
});

export const createIdentityRequestDto = z.object({
    note: z.string().trim().max(150).optional(),
});

export const listRequestsQueryDto = paginationDto.extend({
    status: z.enum(Object.values(IDENTITY_REQUEST_STATUS)).optional(),
});

export const requestIdParamsDto = z.object({
    requestId: objectId("request id"),
});

export const respondRequestDto = z.object({
    action: z.enum(["accept", "reject"]),
});

export const conversationIdParamsDto = z.object({
    conversationId: objectId("conversation id"),
});

export const chatMessageParamsDto = z.object({
    conversationId: objectId("conversation id"),
    chatMessageId: objectId("message id"),
});

export const chatMessageDto = z.object({
    content: z.string().trim().min(1).max(1000),
});

export { paginationDto };
