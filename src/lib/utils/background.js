import { waitUntil } from "@vercel/functions";
import { logger } from "../../pkg/logger/logger.js";

export const runInBackground = (task) => {
    const promise = Promise.resolve()
        .then(task)
        .catch((err) => logger.warn("Background task failed", { error: err?.message }));
    waitUntil(promise);
    return promise;
};
