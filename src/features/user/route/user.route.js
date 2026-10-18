import { Router } from 'express';
import { withCache } from '../../../lib/cache/withCache.js';
import { User } from '../model/user.model.js';
import { uploadMultipleFile, uploadSingleFile } from "../../../lib/media/multer.js";
import { allowedFields, fileValidation } from "../../../lib/media/file.validation.js";
import { authGuard } from "../../../lib/auth/guard.js";
import { uploadProfilePicture } from "../controller/user.controller.js"; // Fixed: controller (singular)

const userRouter = Router();

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
    authGuard,
    uploadSingleFile('file', allowedFields.images),
    fileValidation(allowedFields.images),
    asyncHandler(uploadProfilePicture)
);

userRouter.post(
    '/upload-cv',
    authGuard,
    uploadSingleFile('cv', allowedFields.files),
    fileValidation(allowedFields.files),
    asyncHandler(async (req, res, next) => {
        res.json({ message: 'Upload CV successful', success: true, file: req.file });
    })
);

userRouter.post(
    '/upload-cover-images',
    authGuard,
    uploadMultipleFile('cover-images', 3, allowedFields.images),
    fileValidation(allowedFields.images),
    asyncHandler(async (req, res, next) => {
        res.json({ message: 'Upload cover images successful', success: true, files: req.files });
    })
);

export default userRouter;