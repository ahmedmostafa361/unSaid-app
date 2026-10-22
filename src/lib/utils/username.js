import crypto from "node:crypto";

export const toUsernameBase = (value = "") => {
    const base = String(value)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9._]/g, "")
        .replace(/^[._]+|[._]+$/g, "")
        .slice(0, 20);
    return base.length >= 3 ? base : `user${base}`;
};

export const randomUsernameFrom = (value) => {
    return `${toUsernameBase(value)}${crypto.randomInt(1000, 10000)}`;
};
