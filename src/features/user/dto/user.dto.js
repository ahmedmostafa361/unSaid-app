import { z } from "zod";
import { objectId, paginationDto, passwordSchema, usernameSchema } from "../../../lib/validation/validation.js";

export const updateProfileDto = z
    .object({
        name: z.string().trim().min(3).max(20).optional(),
        username: usernameSchema.optional(),
        bio: z.string().trim().max(160).optional(),
        dob: z.coerce.date().max(new Date(), "Date of birth can't be in the future").nullable().optional(),
        gender: z.enum(["Male", "Female"]).nullable().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, "Send at least one field to update");

export const updateSettingsDto = z
    .object({
        acceptMessages: z.boolean().optional(),
        allowGuestMessages: z.boolean().optional(),
        showPublicMessages: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, "Send at least one setting to update");

export const changePasswordDto = z
    .object({
        currentPassword: z.string().min(1).max(128).optional(),
        newPassword: passwordSchema,
    })
    .strict();

export const deleteAccountDto = z.object({
    password: z.string().min(1).max(128).optional(),
});

export const usernameParamsDto = z.object({
    username: usernameSchema,
});

export const userIdParamsDto = z.object({
    userId: objectId("user id"),
});

export const blockIdParamsDto = z.object({
    blockId: objectId("block id"),
});

export const searchUsersDto = paginationDto.extend({
    q: z.string().trim().min(1, "Search text is required").max(30),
});

export const listUsersDto = paginationDto.extend({
    includeDeleted: z
        .enum(["true", "false"])
        .default("false")
        .transform((value) => value === "true"),
});
