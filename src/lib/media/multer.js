import multer, { diskStorage } from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { AppError } from "../errors/error.js";
import { allowedFields, MAX_FILE_SIZE } from "./file.validation.js";
import { env } from "../config/env.js";

export const UPLOADS_URL_PREFIX = "uploads";

export const UPLOADS_DIR = env.isServerless ? path.join("/tmp", "uploads") : "uploads";

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const extensions = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
};

function fileUpload(allowedTypes = allowedFields.images, maxFiles = 1) {
    return multer({
        limits: { fileSize: MAX_FILE_SIZE, files: maxFiles },
        fileFilter: (req, file, cb) => {
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new AppError("Invalid file format MIME type", 400), false);
            }
        },
        storage: diskStorage({
            destination: UPLOADS_DIR,
            filename: (req, file, cb) => {
                const extension = extensions[file.mimetype] ?? path.extname(file.originalname).toLowerCase();
                cb(null, `${crypto.randomUUID()}${extension}`);
            },
        }),
    });
}

export function uploadSingleFile(fieldName, allowedTypes = allowedFields.images) {
    return fileUpload(allowedTypes, 1).single(fieldName);
}

export function uploadMultipleFile(fieldName, maxCount, allowedTypes = allowedFields.images) {
    return fileUpload(allowedTypes, maxCount).array(fieldName, maxCount);
}

export function uploadMultipleFileWithSize(fields, allowedTypes = allowedFields.images) {
    const maxFiles = fields.reduce((sum, field) => sum + (field.maxCount ?? 1), 0);
    return fileUpload(allowedTypes, maxFiles).fields(fields);
}

const fileNameOf = (storedPath) => String(storedPath).split(/[\\/]/).pop();

export const toPublicPath = (filePath) => (filePath ? `${UPLOADS_URL_PREFIX}/${fileNameOf(filePath)}` : null);

export const toDiskPath = (publicPath) => (publicPath ? path.join(UPLOADS_DIR, fileNameOf(publicPath)) : null);
