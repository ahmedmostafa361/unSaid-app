import * as userService from "../service/user.service.js"; // service (singular)
import { validateBody, paginationDto } from "../../../lib/validation/validation.js";
import { clearAuthCookies } from "../../../lib/auth/cookies.js";
import { noFileUploaded } from "../errors.js";
import {
    blockIdParamsDto,
    changePasswordDto,
    deleteAccountDto,
    listUsersDto,
    searchUsersDto,
    updateProfileDto,
    updateSettingsDto,
    userIdParamsDto,
    usernameParamsDto,
} from "../dto/user.dto.js";

export const getMe = async (req, res) => {
    const user = await userService.getMe(req.user.userId);
    res.status(200).json({ message: "Your profile", success: true, data: user });
};

export const updateMe = async (req, res) => {
    const data = validateBody(updateProfileDto, req.body);
    const user = await userService.updateProfile(req.user.userId, data);
    res.status(200).json({ message: "Profile updated", success: true, data: user });
};

export const updateSettings = async (req, res) => {
    const data = validateBody(updateSettingsDto, req.body);
    const settings = await userService.updateSettings(req.user.userId, data);
    res.status(200).json({ message: "Settings updated", success: true, data: settings });
};

export const changePassword = async (req, res) => {
    const data = validateBody(changePasswordDto, req.body);
    const result = await userService.changePassword(req.user.userId, req.user.sessionId, data);
    res.status(200).json({
        message: "Password changed. You were logged out of your other devices",
        success: true,
        data: result,
    });
};

export const deleteMe = async (req, res) => {
    const { password } = validateBody(deleteAccountDto, req.body);
    const result = await userService.deleteAccount(req.user.userId, password);
    clearAuthCookies(res);
    res.status(200).json({
        message: "Account deleted. You can restore it within 30 days using /api/auth/restore-account",
        success: true,
        data: result,
    });
};

export const uploadProfilePicture = async (req, res) => {
    if (!req.file) throw noFileUploaded();
    const data = await userService.uploadProfilePictureService(req.user.userId, req.file);
    res.status(200).json({ message: "Profile picture updated", success: true, data });
};

export const removeProfilePicture = async (req, res) => {
    await userService.removeProfilePicture(req.user.userId);
    res.status(200).json({ message: "Profile picture removed", success: true });
};

export const uploadCoverImages = async (req, res) => {
    if (!req.files?.length) throw noFileUploaded("at least one image");
    const data = await userService.uploadCoverImages(req.user.userId, req.files);
    res.status(200).json({ message: "Cover images updated", success: true, data });
};

export const uploadCv = async (req, res) => {
    if (!req.file) throw noFileUploaded("a PDF or Word file");
    const data = await userService.uploadCv(req.user.userId, req.file);
    res.status(200).json({ message: "CV uploaded", success: true, data });
};

export const getPublicProfile = async (req, res) => {
    const { username } = validateBody(usernameParamsDto, req.params);
    const profile = await userService.getPublicProfile(username);
    res.status(200).json({ message: "Public profile", success: true, data: profile });
};

export const searchUsers = async (req, res) => {
    const { q, page, limit } = validateBody(searchUsersDto, req.query);
    const { users, pagination } = await userService.searchUsers(q, req.user?.userId, { page, limit });
    res.status(200).json({ message: "Search results", success: true, data: users, pagination });
};

export const blockUser = async (req, res) => {
    const { userId } = validateBody(userIdParamsDto, req.params);
    await userService.blockUser(req.user.userId, userId);
    res.status(200).json({ message: "User blocked", success: true });
};

export const unblockUser = async (req, res) => {
    const { userId } = validateBody(userIdParamsDto, req.params);
    await userService.unblockUser(req.user.userId, userId);
    res.status(200).json({ message: "User unblocked", success: true });
};

export const getBlockedUsers = async (req, res) => {
    const query = validateBody(paginationDto, req.query);
    const { blocks, pagination } = await userService.getBlockedUsers(req.user.userId, query);
    res.status(200).json({ message: "Blocked users", success: true, data: blocks, pagination });
};

export const removeBlock = async (req, res) => {
    const { blockId } = validateBody(blockIdParamsDto, req.params);
    await userService.removeBlockById(req.user.userId, blockId);
    res.status(200).json({ message: "Unblocked", success: true });
};

export const listUsers = async (req, res) => {
    const query = validateBody(listUsersDto, req.query);
    const { users, pagination } = await userService.listUsers(query);
    res.status(200).json({ message: "All users", success: true, data: users, pagination });
};
