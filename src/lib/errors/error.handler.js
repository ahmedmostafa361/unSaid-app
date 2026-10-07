import {logger} from "../../pkg/logger/logger.js";

export function globalErrorHandler (err, req, res, _next){
    logger.error(err.message,{
        stack: err.stack,
        correlationId: req.correlationId,
    });
    if (err.isOperational === true) {  /// to handle our custom errors we did
        return res.status(err.statusCode).json({
            message: err.message,
            success: false,
            stack: err.stack,
        });
    }
    return res.status(500).json({
        message: "Something went wrong",
        success: false,
    });
}