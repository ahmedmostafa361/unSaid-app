import {Router} from "express";
import messageRouter from "./features/message/route/message.route.js";
import authRouter from "./features/auth/route/auth.route.js";
import userRoutes from "./features/user/route/user.route.js";
export const router = Router();
router.use('/auth', authRouter);
router.use('/messages', messageRouter);
router.use('/user', userRoutes); // Fixed variable reference
