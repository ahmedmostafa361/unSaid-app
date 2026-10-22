export class AppError extends Error {
    constructor(message, statusCode = 500, extras = {}) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = extras.code;
        this.details = extras.details;
        Error.captureStackTrace(this, this.constructor);
    }
}
