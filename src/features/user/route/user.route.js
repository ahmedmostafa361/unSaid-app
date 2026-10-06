import { Router } from 'express';
import { withCache } from '../../../lib/cache/withCache.js';
import { User } from '../model/user.model.js';
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

export default userRouter;