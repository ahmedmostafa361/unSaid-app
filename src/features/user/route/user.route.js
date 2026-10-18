import { Router } from 'express';
import { withCache } from '../../../lib/cache/withCache.js';
import { User } from '../model/user.model.js';
import {uploadMultipleFile, uploadSingleFile} from "../../../lib/media/multer.js";
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

userRouter.patch(
    '/upload-profile-picture', uploadSingleFile('file',['image/png, ;image/jpeg']),(req, res,next) => {
        console.log(req.files);
        res.json({message: 'upload profile picture', success: true});
    }
);
userRouter.patch(
    '/upload-cv', uploadSingleFile('cv',['application/pdf','application/msword']),(req, res,next) => {
        res.json({message: 'upload cv', success: true});
    }
);
userRouter.patch(
    '/upload-cover-images', uploadMultipleFile('cover-images',3),(req, res,next) => {
        console.log(req.files);
        res.json({message: 'upload cover images', success: true});
    }
);


export default userRouter;