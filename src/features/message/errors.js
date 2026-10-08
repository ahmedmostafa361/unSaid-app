import { AppError } from "../../lib/errors/error.js"; // adjust to your error class

export const cannotMessageSelf = new AppError("You cannot send a message to yourself", 400);