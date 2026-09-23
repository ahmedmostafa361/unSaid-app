import { AppError } from "../../common/errors/error.js";

export const userAlreadyExists = new AppError("User already exists",409);
export const userNotExist = new AppError("User not found",404);
export const userAlreadyVerified = new AppError("User is already verified",400);
export const userNotVerified = new AppError("User is not verified",403);