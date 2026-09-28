import {z} from 'zod';

export const registerDto = z.object(
    {
        name: z.string().min(3).max(20),
        email: z.string().lowercase().trim(),
        password: z.string().min(6).trim(),
        dob: z.date().optional(),
        gender: z.enum(['Male','Female']).optional(),
    }
);

export const loginDto = z.object(
    {
        email: z.string().lowercase().trim(),
        password: z.string().min(6).trim(),
    }
);

export const sendOtpDto = z.object(
    {
        email: z.string().lowercase().trim(),
    }
);

export const resetPasswordDto = z.object(
    {
        email: z.string().lowercase().trim(),
        code: z.string().length(6).trim(),
        newPassword: z.string().min(6).trim(),
    }
);

export const verifyEmailDto = z.object({
    email: z.string().lowercase().trim(),
    code: z.string().length(6).trim()
});