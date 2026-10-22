import { z } from "zod";
import { AppError } from "../errors/error.js";

export const validateBody = (dto, body) => {
    // Validate that 'dto' passed in is a valid Zod schema using 'z'
    if (!(dto instanceof z.ZodType)) {
        throw new Error("Invalid schema provided to validateBody");
    }

    const result = dto.safeParse(body ?? {});

    if (!result.success) {
        const errorMessages = result.error.issues.map((issue) =>
            issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message
        );
        throw new AppError(errorMessages.join(", "), 400, { code: "VALIDATION_ERROR" });
    }

    return result.data;
};

export const objectId = (label = "id") =>
    z.string().trim().regex(/^[0-9a-fA-F]{24}$/, `Invalid ${label}`);

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Invalid email address"));

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be at most 64 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number");

export const otpCodeSchema = z.string().trim().regex(/^\d{6}$/, "Code must be 6 digits");

export const usernameSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-z0-9._]+$/, "Username can only contain letters, numbers, dots and underscores");

export const paginationDto = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});
