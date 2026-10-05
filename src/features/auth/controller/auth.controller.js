import * as authService from '../service/auth.service.js';
import {toMs} from "../../../pkg/utils/time.js";
import {validateBody} from "../../../lib/validation/validation.js";
import {registerDto,verifyEmailDto,loginDto,resetPasswordDto,sendOtpDto} from "../dto/auth.dto.js";

export const register = async (req,res,next) => {
    try{
        const data = validateBody(registerDto,req.body);
        const createdUser = await authService.register(data);
        res.status(201).json({
            message: "User created successfully",
            success: true,
            data: createdUser
        });
    }catch (error){
        next(error);
    }
}

export const verifyAccount = async (req,res,next) => {
    try{

        const data = validateBody(verifyEmailDto,req.body);
        const {email,code} = data;
        const updatedUser = await authService.verifyAccount(email,code);
        res.status(200).json({
            message: "Account verified successfully",
            success: true,
            data: updatedUser
        });
    }catch (error){
        next(error);
    }
}

export const login = async (req,res,next) => {
    try{
        const data = validateBody(loginDto,req.body);
        const {email,password} = data;
        const token = await authService.login(email,password);
        res.cookie('access_token',token,{
            httpOnly: true,
            maxAge: toMs(1, "hours")
        })
        res.status(200).json({
            message: "Login successful",
            success: true
        });
    }catch (error){
        next(error);
    }
}

export const sendOtp = async (req,res,next) => {
    try{
        const data = validateBody(sendOtpDto,req.body);
        const {email} = data;
        await authService.sendOtp(email);
        res.status(200).json({
            message: "OTP sent successfully",
            success: true
        });
    }catch (error){
        next(error);
    }
}

export const resetPasswordController = async (req,res,next) => {
    try{
        const data = validateBody(resetPasswordDto,req.body);
        const {email,code,newPassword} = data;
        await authService.resetPassword(email,code,newPassword);
        res.status(200).json({
            message: "Password reset successfully",
            success: true
        });
    }catch (error){
        next(error);
    }
}

export const loginWithGoogle = async (req,res,next) => {
    try{
        const {idToken} = req.body;
        const user = await authService.loginWithGoogle(idToken);
        res.cookie('access_token',user.token,{
            httpOnly: true,
            maxAge: toMs(1, "hours")
        });
        res.status(200).json({
            message: "Login successful",
            success: true,
            data: user
        });
    }catch (error){
        next(error);
    }
}