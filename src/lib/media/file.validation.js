import { fileTypeFromBuffer } from "file-type";
import fs from "fs";
import { AppError } from "../errors/error.js";

export const allowedFields = {
    images: ['image/png', 'image/jpeg'],
    videos: ['video/mp4'],
    files: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
};

// Helper function to safely delete files if validation fails
const cleanupFiles = (filesList) => {
    filesList.forEach((file) => {
        if (file && file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (err) {
                console.error("Failed to delete invalid file:", err);
            }
        }
    });
};

export const fileValidation = (allowedTypes = allowedFields.images) => async (req, res, next) => {
    try {
        // Gather all uploaded files regardless of single/multiple/fields configuration
        const filesToValidate = [];

        if (req.file) {
            filesToValidate.push(req.file);
        } else if (req.files) {
            if (Array.isArray(req.files)) {
                filesToValidate.push(...req.files);
            } else {
                // Handles multer .fields() where req.files is an object of arrays
                for (const fieldName of Object.keys(req.files)) {
                    filesToValidate.push(...req.files[fieldName]);
                }
            }
        }

        // If no files were uploaded, pass through
        if (filesToValidate.length === 0) {
            return next();
        }

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes

        // Validate size and magic number for every uploaded file
        for (const file of filesToValidate) {
            // 1. Check file size
            if (file.size > MAX_SIZE) {
                cleanupFiles(filesToValidate);
                return next(new AppError(`File "${file.originalname}" exceeds the 5MB size limit.`, 400));
            }

            // 2. Check magic number (file signature)
            const buffer = fs.readFileSync(file.path);
            const type = await fileTypeFromBuffer(buffer);

            if (!type || !allowedTypes.includes(type.mime)) {
                cleanupFiles(filesToValidate);
                return next(new AppError(
                    `Unsupported file type (${type?.mime || 'unknown'}). Allowed types: ${allowedTypes.join(', ')}`,
                    400
                ));
            }
        }

        return next();
    } catch (error) {
        // Cleanup on unexpected errors
        if (req.file) cleanupFiles([req.file]);
        if (req.files) {
            const allFiles = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
            cleanupFiles(allFiles);
        }
        return next(new AppError("Internal server error during file validation", 500));
    }
};