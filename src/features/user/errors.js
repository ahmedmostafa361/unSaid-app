import { AppError } from "../../lib/errors/error.js";
import { ACCOUNT_RESTORE_DAYS } from "../../lib/config/constants.js";

export const userAlreadyExists = () => new AppError("User already exists", 409, { code: "USER_EXISTS" });
export const usernameTaken = () => new AppError("This username is already taken", 409, { code: "USERNAME_TAKEN" });
export const userNotExist = () => new AppError("User not found", 404, { code: "USER_NOT_FOUND" });
export const userAlreadyVerified = () => new AppError("User is already verified", 400, { code: "ALREADY_VERIFIED" });
export const userNotVerified = () =>
    new AppError("Please verify your email before logging in", 403, { code: "EMAIL_NOT_VERIFIED" });
export const invalidCurrentPassword = () =>
    new AppError("Current password is incorrect", 400, { code: "INVALID_CURRENT_PASSWORD" });
export const samePassword = () =>
    new AppError("New password must be different from the current one", 400, { code: "SAME_PASSWORD" });
export const passwordRequired = () =>
    new AppError("Please enter your password to continue", 400, { code: "PASSWORD_REQUIRED" });
export const cannotBlockSelf = () => new AppError("You can't block yourself", 400, { code: "CANNOT_BLOCK_SELF" });
export const blockNotFound = () => new AppError("Block not found", 404, { code: "BLOCK_NOT_FOUND" });
export const accountDeleted = () =>
    new AppError(
        `This account was deleted. You can restore it within ${ACCOUNT_RESTORE_DAYS} days of deleting it`,
        403,
        { code: "ACCOUNT_DELETED" }
    );
export const restoreWindowExpired = () =>
    new AppError("This account can no longer be restored", 410, { code: "RESTORE_WINDOW_EXPIRED" });
export const accountNotDeleted = () =>
    new AppError("This account is active and doesn't need restoring", 400, { code: "ACCOUNT_NOT_DELETED" });
export const noFileUploaded = (label = "an image file") =>
    new AppError(`Please upload ${label}`, 400, { code: "NO_FILE" });
