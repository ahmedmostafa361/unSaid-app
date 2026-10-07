import crypto from 'crypto';

export function correlationId(req, res, next) {
    const correlationId = crypto.randomUUID();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
}