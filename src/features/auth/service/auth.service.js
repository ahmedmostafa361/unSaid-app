import * as authRepository from "../repository/auth.repo.js";
import * as sessionRepository from "../repository/session.repo.js";
import * as userRepository from "../../user/repository/user.repo.js";
import * as otpService from "./otp.service.js";
import * as tokenService from "./token.service.js";
import * as loginLock from "./loginLock.service.js";
import { generateUniqueUsername, ensureUsername } from "../../user/service/user.service.js";
// import { sendEmail } from "../../../lib/email/init.js";
import { sendEmailInBackground } from "../../../lib/email/init.js";
import { getPasswordChangedEmail, getTwoStepStatusEmail } from "../../../lib/templates/emailTemplates.js";
import { invalidateUserCaches } from "../../../lib/cache/cache.service.js";
import { ACCOUNT_RESTORE_DAYS, AUTH_LIMITS, OTP_PURPOSES } from "../../../lib/config/constants.js";
import { hashPassword, comparePassword } from "../../../pkg/utils/hash.js";
import { maskEmail } from "../../../pkg/utils/string.js";
import { toMs } from "../../../pkg/utils/time.js";
import { verifyGoogleToken } from "../../../lib/utils/google_auth.js";
import {
    accountLocked,
    googleAccountNoPassword,
    googleEmailNotVerified,
    invalidCredentials,
    otpExpired,
    sessionNotFound,
    twoStepAlreadyEnabled,
    twoStepNotEnabled,
} from "../errors.js";
import {
    accountDeleted,
    accountNotDeleted,
    restoreWindowExpired,
    userAlreadyExists,
    userAlreadyVerified,
    userNotExist,
    userNotVerified,
    usernameTaken,
} from "../../user/errors.js";

const isWithinRestoreWindow = (user) =>
    user.deletedAt && Date.now() - new Date(user.deletedAt).getTime() <= toMs(ACCOUNT_RESTORE_DAYS, "days");

const normalizeName = (name = "") => {
    const trimmed = String(name).trim().slice(0, 20);
    return trimmed.length >= 3 ? trimmed : `${trimmed}User`.slice(0, 20);
};

const twoStepChallenge = async (user) => {
    const result = await otpService.sendOtpEmail(user.email, OTP_PURPOSES.LOGIN_TWO_STEP, { skipIfCoolingDown: true });
    return {
        requiresTwoStepVerification: true,
        email: maskEmail(user.email),
        codeExpiresInMinutes: AUTH_LIMITS.otpExpiresMinutes,
        ...(result.sent ? {} : { resendAvailableInSeconds: result.retryAfterSeconds }),
    };
};

const issueLogin = async (user, meta) => {
    const withUsername = await ensureUsername(user);
    const updated = await userRepository.updateUserById(withUsername._id, { lastLoginAt: new Date() });
    const tokens = await tokenService.createSessionTokens(updated, meta);
    return { requiresTwoStepVerification: false, user: updated.toJSON(), tokens };
};

const completeLogin = async (user, meta) => {
    if (user.twoStepEnabled) return twoStepChallenge(user);
    return issueLogin(user, meta);
};

export const register = async (userData) => {
    // 1 check if user already exists
    const existing = await authRepository.checkUserExistByEmail(userData.email);
    // 2 if yes throw error
    if (existing) throw existing.isDeleted ? accountDeleted() : userAlreadyExists();

    if (userData.username) {
        if (await userRepository.usernameExists(userData.username)) throw usernameTaken();
    } else {
        userData.username = await generateUniqueUsername(userData.name);
    }

    // 3 prepare data hash password
    userData.password = await hashPassword(userData.password);

    // 4 save user into data base -> isVerified: false
    const createdUser = await authRepository.createUser({ ...userData, provider: "local" });

    // 5 generate OTP and save it into database
    // 6 send email verification OTP
    let emailSent = true;
    try {
        await otpService.sendOtpEmail(createdUser.email, OTP_PURPOSES.VERIFY_EMAIL);
    } catch {
        emailSent = false;
    }

    return { user: createdUser.toJSON(), emailSent };
};

// verify email using email and code otp
export const verifyAccount = async (email, code) => {
    // 1 check if user exists
    const user = await userRepository.findUserByEmail(email);
    if (!user || user.isDeleted) throw userNotExist();
    // 2 check if user is already verified
    if (user.isVerified) throw userAlreadyVerified();

    // 3 check if otp is valid (search in db by email)
    // 3.1 otp not exist in db >> error otp expired >> resend otp
    // 3.2 otp stored in db >> code not match >> error invalid OTP
    // 5 delete otp from db
    await otpService.verifyOtp(email, OTP_PURPOSES.VERIFY_EMAIL, code);

    // 4 switch isVerified to true [update user]
    return userRepository.updateUserByEmail(email, { isVerified: true });
};

// send otp
// send otp
export const sendOtp = async (email, purpose) => {
    // 1 check user existence
    const user = await userRepository.findUserByEmail(email);
    if (!user) return;

    const canReceive = {
        [OTP_PURPOSES.VERIFY_EMAIL]: !user.isDeleted && !user.isVerified,
        [OTP_PURPOSES.RESET_PASSWORD]: !user.isDeleted,
        [OTP_PURPOSES.RESTORE_ACCOUNT]: user.isDeleted && isWithinRestoreWindow(user),
    };

    if (!canReceive[purpose]) return;

    // 2 delete all old otps
    // 3 generate otp
    // 4 save otp into database with required email and expiration
    // 5 send otp email
    // 5 send reset password otp email
    await otpService.sendOtpEmail(email, purpose);
};

export const resetPassword = async (email, code, newPassword) => {
    /// 1.verify otp code
    /// 4 delete otp
    await otpService.verifyOtp(email, OTP_PURPOSES.RESET_PASSWORD, code);

    const user = await userRepository.findUserByEmail(email);
    if (!user || user.isDeleted) throw userNotExist();

    ///2 hash password
    const hashedPassword = await hashPassword(newPassword);

    // 3. update user password
    await userRepository.updateUserByEmail(email, {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        isVerified: true,
    });

    await Promise.all([sessionRepository.deleteUserSessions(user._id), loginLock.unlockAccount(user._id)]);

    if (user.settings?.emailNotifications !== false) {
        const { subject, html } = getPasswordChangedEmail(user.name);
        sendEmailInBackground(user.email, subject, html);
    }
};

// login
export const login = async (email, password, meta) => {
    // 1 check user existence
    const user = await authRepository.checkUserExistByEmail(email);
    if (!user) throw invalidCredentials();

    const lockRemaining = await loginLock.getLockRemainingSeconds(user._id);
    if (lockRemaining > 0) throw accountLocked(lockRemaining);

    if (!user.password) throw googleAccountNoPassword();

    // 2 compare password
    const isPasswordMatched = await comparePassword(password, user.password);

    if (!isPasswordMatched) {
        const result = await loginLock.registerFailedLogin(user);
        if (result.locked) throw accountLocked(result.retryAfterSeconds);
        throw invalidCredentials(result.attemptsLeft);
    }

    await loginLock.clearFailedLogins(user._id);

    if (user.isDeleted) throw accountDeleted();
    if (!user.isVerified) throw userNotVerified();

    // 3 generate access token
    //{
    //             userId: user._id,
    //             email: user.email,
    //             name: user.name,
    //             isVerified: user.isVerified,
    //         },
    // 4 return user
    return completeLogin(user, meta);
};

export const confirmLogin = async (email, code, meta) => {
    const user = await userRepository.findUserByEmail(email);
    if (!user || user.isDeleted) throw otpExpired();
    if (!user.twoStepEnabled) throw twoStepNotEnabled();

    await otpService.verifyOtp(email, OTP_PURPOSES.LOGIN_TWO_STEP, code);

    return issueLogin(user, meta);
};

/// login with google
export const loginWithGoogle = async (idToken, meta) => {
    //1. verify idToken
    const payload = await verifyGoogleToken(idToken);
    if (!payload?.email || payload.email_verified === false) throw googleEmailNotVerified();

    //3. check if user exists >> if exist generate token
    const email = payload.email.toLowerCase();
    let user = await userRepository.findUserByEmail(email);

    if (user?.isDeleted) throw accountDeleted();

    //4. if not create user
    if (!user) {
        const fallbackName = email.split("@")[0];
        user = await authRepository.createUser({
            email,
            name: normalizeName(payload.name ?? fallbackName),
            username: await generateUniqueUsername(payload.given_name ?? fallbackName),
            provider: "google",
            isVerified: true,
        });
    } else if (!user.isVerified) {
        user = await userRepository.updateUserById(user._id, { isVerified: true });
    }

    //5. login user and generate token
    return completeLogin(user, meta);
};

export const refreshTokens = async (refreshToken, meta) => {
    return tokenService.rotateRefreshToken(refreshToken, meta);
};

export const logout = async (sessionId) => {
    await sessionRepository.deleteSession(sessionId);
};

export const logoutAll = async (userId) => {
    const result = await sessionRepository.deleteUserSessions(userId);
    return { revokedSessions: result.deletedCount };
};

export const listSessions = async (userId, currentSessionId) => {
    const sessions = await sessionRepository.listUserSessions(userId);
    return sessions.map((session) => ({
        ...session,
        isCurrent: String(session._id) === String(currentSessionId),
    }));
};

export const revokeSession = async (userId, sessionId) => {
    const deleted = await sessionRepository.deleteSession(sessionId, userId);
    if (!deleted) throw sessionNotFound();
};

export const restoreAccount = async (email, code) => {
    const user = await userRepository.findUserByEmail(email);
    if (!user) throw otpExpired();
    if (!user.isDeleted) throw accountNotDeleted();
    if (!isWithinRestoreWindow(user)) throw restoreWindowExpired();

    await otpService.verifyOtp(email, OTP_PURPOSES.RESTORE_ACCOUNT, code);

    const restored = await userRepository.updateUserById(user._id, { isDeleted: false, deletedAt: null });
    await invalidateUserCaches(restored.username);
    return restored;
};

export const requestEnableTwoStep = async (userId) => {
    const user = await userRepository.findUserById(userId);
    if (!user) throw userNotExist();
    if (user.twoStepEnabled) throw twoStepAlreadyEnabled();

    await otpService.sendOtpEmail(user.email, OTP_PURPOSES.ENABLE_TWO_STEP);
    return { email: maskEmail(user.email), codeExpiresInMinutes: AUTH_LIMITS.otpExpiresMinutes };
};

export const confirmEnableTwoStep = async (userId, code) => {
    const user = await userRepository.findUserById(userId);
    if (!user) throw userNotExist();
    if (user.twoStepEnabled) throw twoStepAlreadyEnabled();

    await otpService.verifyOtp(user.email, OTP_PURPOSES.ENABLE_TWO_STEP, code);
    await userRepository.updateUserById(userId, { twoStepEnabled: true });

    const { subject, html } = getTwoStepStatusEmail(user.name, true);
    sendEmailInBackground(user.email, subject, html);
};

export const requestDisableTwoStep = async (userId) => {
    const user = await userRepository.findUserById(userId);
    if (!user) throw userNotExist();
    if (!user.twoStepEnabled) throw twoStepNotEnabled();

    await otpService.sendOtpEmail(user.email, OTP_PURPOSES.DISABLE_TWO_STEP);
    return { email: maskEmail(user.email), codeExpiresInMinutes: AUTH_LIMITS.otpExpiresMinutes };
};

export const confirmDisableTwoStep = async (userId, code) => {
    const user = await userRepository.findUserById(userId);
    if (!user) throw userNotExist();
    if (!user.twoStepEnabled) throw twoStepNotEnabled();

    await otpService.verifyOtp(user.email, OTP_PURPOSES.DISABLE_TWO_STEP, code);
    await userRepository.updateUserById(userId, { twoStepEnabled: false });

    const { subject, html } = getTwoStepStatusEmail(user.name, false);
    sendEmailInBackground(user.email, subject, html);
};
