import fs from "node:fs/promises";
import { logger } from "../logger/logger.js";

export const removeFile = async (filePath) => {
    if (!filePath) return;
    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            logger.warn("Failed to delete file", { filePath, error: error.message });
        }
    }
};

export const removeFiles = async (filePaths = []) => {
    await Promise.all(filePaths.filter(Boolean).map(removeFile));
};
