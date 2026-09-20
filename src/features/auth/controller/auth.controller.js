import * as authService from '../service/auth.service.js';
import {toMs} from "../../../common/utils/time.js";

export const register = async (req,res,next) => {
    try{
        const createdUser = await authService.register(req.body);
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
        const {email,code} = req.body;
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
        const {email,password} = req.body;
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
        const {email} = req.body;
        await authService.sendOtp(email);
        res.status(200).json({
            message: "OTP sent successfully",
            success: true
        });
    }catch (error){
        next(error);
    }
}