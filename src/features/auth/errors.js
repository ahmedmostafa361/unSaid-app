import {AppError} from "../../common/errors/error.js";


export const invalidPassword = new AppError("Invalid password",403);
export const invalidEmail = new AppError("Invalid email",403);
export const otpExpired = new AppError("Invalid or Expired OTP , please resend OTP",404);
export const invalidCode = new AppError("Invalid OTP",400);