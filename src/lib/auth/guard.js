import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/error.js";

export function authGuard(req, res, next) {
    try {
        // read the token from the cookie
        const token = req.cookies?.access_token;
        if (!token) throw new AppError("No token provided", 401);

        // verify and attach the payload (userId, email, name, isVerified)
        req.user = jwt.verify(token, env.jwtSecret);

        next();
    } catch (error) {
        // bad or expired token -> 401 instead of a generic 500
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return next(new AppError("Invalid or expired token", 401));
        }
        next(error);
    }
}

// optional guard for anonymous senders: sets req.user if a valid token exists, never blocks
export function optionalGuard(req, res, next) {
    try {
        const token = req.cookies?.access_token;
        if (token) req.user = jwt.verify(token, env.jwtSecret);
    } catch {
        // ignore invalid token, treat as anonymous
    }
    next();
}