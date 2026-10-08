import { z } from 'zod';

export const sendMessageDto = z.object({
    content: z.string().trim().min(1).max(200),
    receiverId: z
        .string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid receiver id'),
});