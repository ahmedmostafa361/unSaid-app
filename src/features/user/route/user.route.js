import { Router } from "express";
import * as userController from "../controller/user.controller.js"; // Fixed: controller (singular)
import { withCache } from "../../../lib/cache/withCache.js";
import { cacheKeys } from "../../../lib/cache/cache.service.js";
import { CACHE_TTL, USER_ROLES } from "../../../lib/config/constants.js";
import { uploadMultipleFile, uploadSingleFile } from "../../../lib/media/multer.js";
import { allowedFields, fileValidation } from "../../../lib/media/file.validation.js";
import { authGuard, authorize, optionalGuard } from "../../../lib/auth/guard.js";
import { rateLimit } from "../../../lib/rate-limit/rateLimit.js";

const userRouter = Router();

const searchLimit = rateLimit({ name: "user-search", windowSeconds: 60, max: 30 });

userRouter.get("/", authGuard, authorize(USER_ROLES.ADMIN), userController.listUsers);

userRouter.get("/me", authGuard, userController.getMe);
userRouter.patch("/me", authGuard, userController.updateMe);
userRouter.delete("/me", authGuard, userController.deleteMe);
userRouter.patch("/me/settings", authGuard, userController.updateSettings);
userRouter.patch("/me/password", authGuard, userController.changePassword);

userRouter.post(
    "/me/profile-picture",
    authGuard,
    uploadSingleFile("file", allowedFields.images),
    fileValidation(allowedFields.images),
    userController.uploadProfilePicture
);
userRouter.delete("/me/profile-picture", authGuard, userController.removeProfilePicture);

userRouter.post(
    "/me/cover-images",
    authGuard,
    uploadMultipleFile("cover-images", 3, allowedFields.images),
    fileValidation(allowedFields.images),
    userController.uploadCoverImages
);

userRouter.post(
    "/me/cv",
    authGuard,
    uploadSingleFile("cv", allowedFields.files),
    fileValidation(allowedFields.files),
    userController.uploadCv
);

userRouter.get("/me/blocked", authGuard, userController.getBlockedUsers);
userRouter.delete("/me/blocked/:blockId", authGuard, userController.removeBlock);

userRouter.get("/search", optionalGuard, searchLimit, userController.searchUsers);

userRouter.get(
    "/u/:username",
    withCache({
        ttl: CACHE_TTL.publicProfile,
        namespace: (req) => cacheKeys.publicProfile(req.params.username),
    }),
    userController.getPublicProfile
);

userRouter.post("/:userId/block", authGuard, userController.blockUser);
userRouter.delete("/:userId/block", authGuard, userController.unblockUser);

export default userRouter;
