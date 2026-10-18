import { Router } from 'express';
import { withCache } from '../../../lib/cache/withCache.js';
import { User } from '../model/user.model.js';
import { uploadMultipleFile, uploadSingleFile } from "../../../lib/media/multer.js";
import { allowedFields, fileValidation } from "../../../lib/media/file.validation.js";

const userRouter = Router();

// forwards async errors to globalErrorHandler (needed on Express 4)
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

userRouter.get(
    '/get-all-users',
    withCache(),
    asyncHandler(async (req, res) => {
        const users = await User.find();
        res.json({ message: 'All users', success: true, data: users });
    })
);

userRouter.post(
    '/upload-profile-picture',
    uploadSingleFile('file', allowedFields.images),
    fileValidation(allowedFields.images),
    (req, res, next) => {
        console.log(req.file); // Fixed: req.file (singular)
        res.json({ message: 'Upload profile picture successful', success: true, file: req.file });
    }
);

userRouter.post(
    '/upload-cv',
    uploadSingleFile('cv', allowedFields.files),
    fileValidation(allowedFields.files),
    (req, res, next) => {
        res.json({ message: 'Upload CV successful', success: true, file: req.file });
    }
);

userRouter.post(
    '/upload-cover-images',
    uploadMultipleFile('cover-images', 3, allowedFields.images),
    fileValidation(allowedFields.images), // Added missing file validation middleware
    (req, res, next) => {
        console.log(req.files); // req.files (plural) is correct for .array()
        res.json({ message: 'Upload cover images successful', success: true, files: req.files });
    }
);

export default userRouter;