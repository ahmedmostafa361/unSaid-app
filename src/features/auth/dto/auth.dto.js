import { z } from "zod";
import {
    emailSchema,
    objectId,
    otpCodeSchema,
    passwordSchema,
    usernameSchema,
} from "../../../lib/validation/validation.js";
import { OTP_PURPOSES } from "../../../lib/config/constants.js";

export const registerDto = z.object({
    name: z.string().trim().min(3).max(20),
    username: usernameSchema.optional(),
    email: emailSchema,
    password: passwordSchema,
    dob: z.coerce
        .date()
        .max(new Date(), "Date of birth can't be in the future")
        .optional(),
    gender: z.enum(["Male", "Female"]).optional(),
});

export const loginDto = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required").max(128),
});

export const confirmLoginDto = z.object({
    email: emailSchema,
    code: otpCodeSchema,
});

export const sendOtpDto = z.object({
    email: emailSchema,
    purpose: z
        .enum([OTP_PURPOSES.VERIFY_EMAIL, OTP_PURPOSES.RESET_PASSWORD, OTP_PURPOSES.RESTORE_ACCOUNT])
        .default(OTP_PURPOSES.RESET_PASSWORD),
});

export const resetPasswordDto = z.object({
    email: emailSchema,
    code: otpCodeSchema,
    newPassword: passwordSchema,
});

export const verifyEmailDto = z.object({
    email: emailSchema,
    code: otpCodeSchema,
});

export const restoreAccountDto = z.object({
    email: emailSchema,
    code: otpCodeSchema,
});

export const googleLoginDto = z.object({
    idToken: z.string().trim().min(1, "idToken is required"),
});

export const refreshTokenDto = z.object({
    refreshToken: z.string().trim().min(1).optional(),
});

export const codeDto = z.object({
    code: otpCodeSchema,
});

export const sessionParamsDto = z.object({
    sessionId: objectId("session id"),
});
