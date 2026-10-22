import { uploadProfilePictureService } from "../service/user.service.js"; // service (singular)
import { AppError } from "../../../lib/errors/error.js";

export const uploadProfilePicture = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError("Please upload an image file", 400));
        }

        // Handles id, _id, or userId depending on JWT payload
        const userId = req.user?.id || req.user?._id || req.user?.userId;

        if (!userId) {
            return next(new AppError("Unauthorized: User ID missing from token", 401));
        }

        await uploadProfilePictureService(userId, req.file);

        res.json({
            message: 'Upload profile picture successful',
            success: true,
            file: req.file
        });
    } catch (error) {
        next(error);
    }
};