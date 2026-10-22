import { AppError } from "../../lib/errors/error.js";

export const invalidCredentials = (attemptsLeft) =>
    new AppError("Invalid email or password", 401, {
        code: "INVALID_CREDENTIALS",
        ...(attemptsLeft !== undefined ? { details: { attemptsLeft } } : {}),
    });

export const invalidPassword = () => invalidCredentials();

export const accountLocked = (retryAfterSeconds) =>
    new AppError(
        `Too many failed login attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s)`,
        429,
        { code: "ACCOUNT_LOCKED", details: { retryAfterSeconds } }
    );

export const invalidCode = (attemptsLeft) =>
    new AppError("Invalid code", 400, {
        code: "INVALID_OTP",
        ...(attemptsLeft !== undefined ? { details: { attemptsLeft } } : {}),
    });

export const otpExpired = () =>
    new AppError("Code expired or not found. Please request a new one", 400, { code: "OTP_EXPIRED" });

export const tooManyOtpAttempts = () =>
    new AppError("Too many wrong codes. Please request a new one", 429, { code: "OTP_ATTEMPTS_EXCEEDED" });

export const otpResendCooldown = (retryAfterSeconds) =>
    new AppError(`Please wait ${retryAfterSeconds} seconds before requesting a new code`, 429, {
        code: "OTP_COOLDOWN",
        details: { retryAfterSeconds },
    });

export const twoStepAlreadyEnabled = () =>
    new AppError("2-step verification is already on", 400, { code: "TWO_STEP_ALREADY_ENABLED" });

export const twoStepNotEnabled = () =>
    new AppError("2-step verification is not on for this account", 400, { code: "TWO_STEP_NOT_ENABLED" });

export const invalidRefreshToken = () =>
    new AppError("Invalid or expired refresh token. Please log in again", 401, { code: "INVALID_REFRESH_TOKEN" });

export const googleAccountNoPassword = () =>
    new AppError("This account uses Google sign-in. Log in with Google or reset your password", 400, {
        code: "GOOGLE_ACCOUNT",
    });

export const googleEmailNotVerified = () =>
    new AppError("Your Google email is not verified", 401, { code: "GOOGLE_EMAIL_NOT_VERIFIED" });

export const sessionNotFound = () => new AppError("Session not found", 404, { code: "SESSION_NOT_FOUND" });
