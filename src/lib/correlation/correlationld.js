import crypto from "node:crypto";

const validId = /^[a-zA-Z0-9-]{8,64}$/;

export function correlationId(req, res, next) {
    const incoming = req.headers["x-correlation-id"];
    const id = typeof incoming === "string" && validId.test(incoming) ? incoming : crypto.randomUUID();
    req.correlationId = id;
    res.setHeader("X-Correlation-ID", id);
    next();
}
