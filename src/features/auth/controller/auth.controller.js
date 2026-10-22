import * as authService from "../service/auth.service.js";
import { validateBody } from "../../../lib/validation/validation.js";
import { clearAuthCookies, setAuthCookies } from "../../../lib/auth/cookies.js";
import {
    codeDto,
    confirmLoginDto,
    googleLoginDto,
    loginDto,
    refreshTokenDto,
    registerDto,
    resetPasswordDto,
    restoreAccountDto,
    sendOtpDto,
    sessionParamsDto,
    verifyEmailDto,
} from "../dto/auth.dto.js";

const requestMeta = (req) => ({
    ip: req.ip,
    userAgent: req.get("user-agent"),
});

const sendLoginResult = (res, result) => {
    if (result.requiresTwoStepVerification) {
        return res.status(200).json({
            message: "We sent a verification code to your email. Send it to /api/auth/login/confirm to finish logging in",
            success: true,
            data: result,
        });
    }

    setAuthCookies(res, result.tokens);
    return res.status(200).json({
        message: "Login successful",
        success: true,
        data: {
            requiresTwoStepVerification: false,
            user: result.user,
            ...result.tokens,
        },
    });
};

export const register = async (req, res) => {
    const data = validateBody(registerDto, req.body);
    const { user, emailSent } = await authService.register(data);
    res.status(201).json({
        message: emailSent
            ? "Account created. Check your email for the verification code"
            : "Account created, but we couldn't send the verification email. Request a new code with /api/auth/send-otp",
        success: true,
        data: user,
    });
};

export const verifyAccount = async (req, res) => {
    const { email, code } = validateBody(verifyEmailDto, req.body);
    const updatedUser = await authService.verifyAccount(email, code);
    res.status(200).json({
        message: "Account verified successfully",
        success: true,
        data: updatedUser,
    });
};

export const sendOtp = async (req, res) => {
    const { email, purpose } = validateBody(sendOtpDto, req.body);
    await authService.sendOtp(email, purpose);
    res.status(200).json({
        message: "If an account matches this email, we sent it a code",
        success: true,
    });
};

export const resetPasswordController = async (req, res) => {
    const { email, code, newPassword } = validateBody(resetPasswordDto, req.body);
    await authService.resetPassword(email, code, newPassword);
    clearAuthCookies(res);
    res.status(200).json({
        message: "Password reset successfully. Please log in with your new password",
        success: true,
    });
};

export const login = async (req, res) => {
    const { email, password } = validateBody(loginDto, req.body);
    const result = await authService.login(email, password, requestMeta(req));
    sendLoginResult(res, result);
};

export const confirmLogin = async (req, res) => {
    const { email, code } = validateBody(confirmLoginDto, req.body);
    const result = await authService.confirmLogin(email, code, requestMeta(req));
    sendLoginResult(res, result);
};

export const loginWithGoogle = async (req, res) => {
    const { idToken } = validateBody(googleLoginDto, req.body);
    const result = await authService.loginWithGoogle(idToken, requestMeta(req));
    sendLoginResult(res, result);
};

export const refreshToken = async (req, res) => {
    const body = validateBody(refreshTokenDto, req.body);
    const token = body.refreshToken ?? req.cookies?.refresh_token;
    const tokens = await authService.refreshTokens(token, requestMeta(req));
    setAuthCookies(res, tokens);
    res.status(200).json({
        message: "Tokens refreshed",
        success: true,
        data: tokens,
    });
};

export const logout = async (req, res) => {
    await authService.logout(req.user.sessionId);
    clearAuthCookies(res);
    res.status(200).json({ message: "Logged out", success: true });
};

export const logoutAll = async (req, res) => {
    const data = await authService.logoutAll(req.user.userId);
    clearAuthCookies(res);
    res.status(200).json({ message: "Logged out from all devices", success: true, data });
};

export const listSessions = async (req, res) => {
    const sessions = await authService.listSessions(req.user.userId, req.user.sessionId);
    res.status(200).json({ message: "Active sessions", success: true, data: sessions });
};

export const revokeSession = async (req, res) => {
    const { sessionId } = validateBody(sessionParamsDto, req.params);
    await authService.revokeSession(req.user.userId, sessionId);
    if (sessionId === req.user.sessionId) clearAuthCookies(res);
    res.status(200).json({ message: "Session revoked", success: true });
};

export const restoreAccount = async (req, res) => {
    const { email, code } = validateBody(restoreAccountDto, req.body);
    const user = await authService.restoreAccount(email, code);
    res.status(200).json({
        message: "Account restored. You can log in now",
        success: true,
        data: user,
    });
};

export const requestEnableTwoStep = async (req, res) => {
    const data = await authService.requestEnableTwoStep(req.user.userId);
    res.status(200).json({
        message: "We sent a code to your email. Send it to /api/auth/two-step/verify to turn on 2-step verification",
        success: true,
        data,
    });
};

export const confirmEnableTwoStep = async (req, res) => {
    const { code } = validateBody(codeDto, req.body);
    await authService.confirmEnableTwoStep(req.user.userId, code);
    res.status(200).json({ message: "2-step verification is now on", success: true });
};

export const requestDisableTwoStep = async (req, res) => {
    const data = await authService.requestDisableTwoStep(req.user.userId);
    res.status(200).json({
        message: "We sent a code to your email. Send it to /api/auth/two-step/disable/confirm to turn off 2-step verification",
        success: true,
        data,
    });
};

export const confirmDisableTwoStep = async (req, res) => {
    const { code } = validateBody(codeDto, req.body);
    await authService.confirmDisableTwoStep(req.user.userId, code);
    res.status(200).json({ message: "2-step verification is now off", success: true });
};
