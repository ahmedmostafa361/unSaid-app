// import bcrypt from "bcrypt"
import argon2 from "argon2";
import crypto from "node:crypto";

export const hashPassword = (password) => {
    return argon2.hash(password);
};

export const comparePassword = async (password, hash) => {
    if (!password || !hash) return false;
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
};

export const hmacHash = (value, secret) => {
    return crypto.createHmac("sha256", secret).update(String(value)).digest("hex");
};

export const sha256 = (value) => {
    return crypto.createHash("sha256").update(String(value)).digest("hex");
};

export const safeEqual = (a, b) => {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
};
