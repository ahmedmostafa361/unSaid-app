import { logger } from "../../pkg/logger/logger.js";
import { env } from "../config/env.js";
import { AppError } from "./error.js";

const multerMessages = {
    LIMIT_FILE_SIZE: "File is too large. Maximum size is 5MB",
    LIMIT_FILE_COUNT: "Too many files uploaded",
    LIMIT_UNEXPECTED_FILE: "Unexpected file field",
};

function normalizeError(err) {
    if (err instanceof AppError) return err; /// to handle our custom errors we did

    if (err?.name === "MulterError") {
        return new AppError(multerMessages[err.code] ?? err.message, 400, { code: err.code });
    }

    if (err?.code === 11000) {
        const field = Object.keys(err.keyValue ?? err.keyPattern ?? {})[0] ?? "value";
        return new AppError(`This ${field} is already in use`, 409, { code: "DUPLICATE_KEY" });
    }

    if (err?.name === "CastError") {
        return new AppError(`Invalid ${err.path}`, 400, { code: "INVALID_ID" });
    }

    if (err?.name === "ValidationError" && err?.errors) {
        const messages = Object.values(err.errors).map((item) => item.message);
        return new AppError(messages.join(", "), 400, { code: "VALIDATION_ERROR" });
    }

    if (err?.type === "entity.parse.failed") {
        return new AppError("Request body is not valid JSON", 400, { code: "INVALID_JSON" });
    }

    if (err?.type === "entity.too.large") {
        return new AppError("Request body is too large", 413, { code: "PAYLOAD_TOO_LARGE" });
    }

    return null;
}

export function globalErrorHandler(err, req, res, _next) {
    const appError = normalizeError(err);

    if (!appError || appError.statusCode >= 500) {
        logger.error(err.message, {
            stack: err.stack,
            correlationId: req.correlationId,
            path: req.originalUrl,
        });
    } else {
        logger.warn(appError.message, {
            statusCode: appError.statusCode,
            correlationId: req.correlationId,
            path: req.originalUrl,
        });
    }

    if (!appError) {
        return res.status(500).json({
            message: "Something went wrong",
            success: false,
            correlationId: req.correlationId,
            ...(env.isProduction ? {} : { stack: err.stack }),
        });
    }

    if (appError.details?.retryAfterSeconds) {
        res.setHeader("Retry-After", String(appError.details.retryAfterSeconds));
    }

    return res.status(appError.statusCode).json({
        message: appError.message,
        success: false,
        ...(appError.code ? { code: appError.code } : {}),
        ...(appError.details ? { details: appError.details } : {}),
        correlationId: req.correlationId,
        ...(env.isProduction ? {} : { stack: appError.stack }),
    });
}

export function notFoundHandler(req, res) {
    res.status(404).json({
        message: `Route ${req.method} ${req.originalUrl} not found`,
        success: false,
    });
}
