import * as userRepository from "../repository/user.repo.js";
import { userNotExist } from "../errors.js";
import fs from "node:fs";

export const uploadProfilePictureService = async (userId, file) => {
    // 1. Get user with await
    const user = await userRepository.findUserById(userId);
    if (!user) throw userNotExist(); // Called as a factory function to get fresh stack trace

    // 2. Delete old image from server if it exists
    if (user.profilePicturePath && fs.existsSync(user.profilePicturePath)) {
        try {
            fs.unlinkSync(user.profilePicturePath);
        } catch (err) {
            console.error("Failed to delete old profile picture:", err);
        }
    }

    // 3. Update new image path matching schema property
    await userRepository.updateUserByEmail(user.email, { profilePicturePath: file.path });
};