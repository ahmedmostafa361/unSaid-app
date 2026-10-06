import {logger} from "../../pkg/logger/logger.js";

export function globalErrorHandler (err, req, res, next){
    logger.error(err.message, err);
    if (err.isOperational === true) {  /// to handle our custom errors we did
        return res.status(err.statusCode).json({
            message: err.message,
            success: false,
            stack: err.stack
        });
    }
    return res.status(500).json({
        message: "Something went wrong",
        success: false,
    });
}