import multer, { diskStorage } from 'multer';
import crypto from 'node:crypto';
import { AppError } from "../errors/error.js";
import { allowedFields } from "./file.validation.js";

function fileUpload(allowedTypes = allowedFields.images) {
    return multer({
        fileFilter: (req, file, cb) => {
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new AppError('Invalid file format MIME type', 400), false);
            }
        },
        storage: diskStorage({
            destination: "uploads",
            filename: (req, file, cb) => {
                cb(null, `${crypto.randomUUID()}-${file.originalname}`);
            }
        })
    });
}

export function uploadSingleFile(fieldName, allowedTypes = allowedFields.images) {
    return fileUpload(allowedTypes).single(fieldName);
}

export function uploadMultipleFile(fieldName, maxCount, allowedTypes = allowedFields.images) {
    return fileUpload(allowedTypes).array(fieldName, maxCount);
}

export function uploadMultipleFileWithSize(fields, allowedTypes = allowedFields.images) {
    return fileUpload(allowedTypes).fields(fields);
}