import { env } from "../config/env.js";
import { AppError } from "../errors/error.js";
import { verifyToken } from "../../pkg/utils/token.js";
import { Session } from "../../features/auth/model/session.model.js";
import { User } from "../../features/user/model/user.model.js";

const extractAccessToken = (req) => {
    const header = req.headers.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
        return header.slice(7).trim();
    }
    // read the token from the cookie
    return req.cookies?.access_token;
};

const decodeAccessToken = (token) => {
    try {
        const payload = verifyToken(token, env.jwtSecret);
        if (payload.type !== "access" || !payload.sub || !payload.sid) {
            throw new Error("Wrong token type");
        }
        return payload;
    } catch (error) {
        // bad or expired token -> 401 instead of a generic 500
        if (error.name === "TokenExpiredError") {
            throw new AppError("Access token expired", 401, { code: "TOKEN_EXPIRED" });
        }
        throw new AppError("Invalid access token", 401, { code: "INVALID_TOKEN" });
    }
};

const resolveUser = async (token) => {
    const payload = decodeAccessToken(token);

    const [session, user] = await Promise.all([
        Session.exists({ _id: payload.sid, user: payload.sub, expiresAt: { $gt: new Date() } }),
        User.findOne({ _id: payload.sub, isDeleted: false })
            .select("name email username role isVerified twoStepEnabled")
            .lean(),
    ]);

    if (!session) {
        throw new AppError("Your session has ended. Please log in again", 401, { code: "SESSION_REVOKED" });
    }
    if (!user) {
        throw new AppError("Account not found", 401, { code: "ACCOUNT_NOT_FOUND" });
    }

    return {
        userId: String(user._id),
        sessionId: String(payload.sid),
        role: user.role,
        email: user.email,
        name: user.name,
        username: user.username,
        twoStepEnabled: user.twoStepEnabled,
    };
};

export async function authGuard(req, res, next) {
    const token = extractAccessToken(req);
    if (!token) {
        return next(new AppError("No token provided", 401, { code: "NO_TOKEN" }));
    }

    try {
        // verify and attach the payload (userId, email, name, isVerified)
        req.user = await resolveUser(token);
        next();
    } catch (error) {
        next(error);
    }
}

// optional guard for anonymous senders: sets req.user if a valid token exists, never blocks
export async function optionalGuard(req, res, next) {
    const token = extractAccessToken(req);
    if (!token) return next();

    try {
        req.user = await resolveUser(token);
        next();
    } catch (error) {
        next(error);
    }
}

export function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError("You don't have permission to do this", 403, { code: "FORBIDDEN" }));
        }
        next();
    };
}
