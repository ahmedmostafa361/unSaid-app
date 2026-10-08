import { z } from 'zod';

export const sendMessageDto = z.object({
    content: z.string().trim().min(1).max(200),
    receiverId: z
        .string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid receiver id'),
});
export const getMessagesQueryDto = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});