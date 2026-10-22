import jwt from "jsonwebtoken";
import crypto from "node:crypto";

/// generate token
export const generateToken = (payload, secret, expiresInSeconds) => {
    return jwt.sign(payload, secret, {
        algorithm: "HS256",
        expiresIn: expiresInSeconds,
    });
};

export const verifyToken = (token, secret) => {
    return jwt.verify(token, secret, { algorithms: ["HS256"] });
};

export const generateRandomToken = (bytes = 48) => {
    return crypto.randomBytes(bytes).toString("base64url");
};
