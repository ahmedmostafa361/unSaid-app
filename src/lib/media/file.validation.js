import { fileTypeFromFile } from "file-type";
import { AppError } from "../errors/error.js";
import { removeFiles } from "../../pkg/utils/files.js";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export const allowedFields = {
    images: ["image/png", "image/jpeg", "image/webp"],
    videos: ["video/mp4"],
    files: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    audio: ["audio/mpeg", "audio/mp3", "audio/wav"],
};

const legacyOfficeTypes = new Set(["application/x-cfb"]);

// Gather all uploaded files regardless of single/multiple/fields configuration
const collectFiles = (req) => {
    if (req.file) return [req.file];
    if (!req.files) return [];
    if (Array.isArray(req.files)) return req.files;
    // Handles multer .fields() where req.files is an object of arrays
    return Object.values(req.files).flat();
};

const isAllowed = (detected, file, allowedTypes) => {
    if (!detected) return false;
    if (allowedTypes.includes(detected.mime)) return true;
    if (file.mimetype === "application/msword" && legacyOfficeTypes.has(detected.mime)) return true;
    if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
        detected.mime === "application/zip"
    ) {
        return allowedTypes.includes(file.mimetype);
    }
    return false;
};

export const fileValidation = (allowedTypes = allowedFields.images) => async (req, res, next) => {
    const files = collectFiles(req);
    // If no files were uploaded, pass through
    if (files.length === 0) return next();

    try {
        // Validate size and magic number for every uploaded file
        for (const file of files) {
            // 1. Check file size
            if (file.size > MAX_FILE_SIZE) {
                await removeFiles(files.map((item) => item.path));
                return next(new AppError(`File "${file.originalname}" exceeds the 5MB size limit.`, 400));
            }

            // 2. Check magic number (file signature)
            const detected = await fileTypeFromFile(file.path);

            if (!isAllowed(detected, file, allowedTypes)) {
                await removeFiles(files.map((item) => item.path));
                return next(
                    new AppError(
                        `Unsupported file type (${detected?.mime || "unknown"}). Allowed types: ${allowedTypes.join(", ")}`,
                        400
                    )
                );
            }
        }

        return next();
    } catch {
        // Cleanup on unexpected errors
        await removeFiles(files.map((item) => item.path));
        return next(new AppError("Internal server error during file validation", 500));
    }
};
