import * as authRepository from "../repository/auth.repo.js";
import * as otpRepository from "../repository/otp.repo.js";
import * as userRepository from "../../user/repository/user.repo.js";

// import { sendEmail } from "../../../lib/email/nodeMailer.js"; this used for node mailer
import { sendEmail } from "../../../lib/email/init.js";
import {
    getPasswordResetTemplate,
    getEmailVerificationTemplate,
} from "../../../lib/templates/emailTemplates.js";
import { toMs } from "../../../pkg/utils/time.js";
import {invalidPassword,invalidCode,
    otpExpired} from "../errors.js";
import {userAlreadyExists, userAlreadyVerified, userNotExist, userNotVerified} from "../../user/errors.js";
import {generateOTP} from "../../../lib/utils/otp.js";
import {generateToken} from "../../../pkg/utils/token.js";
import {hashPassword,comparePassword} from "../../../pkg/utils/hash.js";
import {verifyGoogleToken} from "../../../lib/utils/google_auth.js";


export const register = async (userData) => {
    // 1 check if user already exists
    const userExist = await authRepository.checkUserExistByEmail(
        userData.email
    );
    // 2 if yes throw error
    if (userExist) {
        throw userAlreadyExists;
    }
    // 3 prepare data hash password
    userData.password = await hashPassword(userData.password);
    // 4 save user into data base -> isVerified: false
    const createdUser = await authRepository.createUser(userData);
    // 5 generate OTP and save it into database
    const otpCode = generateOTP()
    await otpRepository.createOtp({
        code: otpCode,
        email: userData.email,
        expiresAt: new Date(Date.now() + toMs(5, "minutes")),
    });
    // 6 send email verification OTP
    await sendEmail(
        userData.email,
        "Email Verification",
        getEmailVerificationTemplate(otpCode)
    );
    return createdUser;
};

// verify email using email and code otp
export const verifyAccount = async (email, code) => {
    // 1 check if user exists
    const user = await authRepository.checkUserExistByEmail(email);
    if (!user) {
        throw userNotExist;
    }
    // 2 check if user is already verified
    if (user.isVerified === true) {
        throw userAlreadyVerified;
    }
    // 3 check if otp is valid (search in db by email)
    const otp = await otpRepository.getOtpByEmail(email);
    // 3.1 otp not exist in db >> error otp expired >> resend otp
    if (!otp) throw otpExpired;
    // 3.2 otp stored in db >> code not match >> error invalid OTP
    if (otp.code !== code) throw invalidCode;
    // 4 switch isVerified to true [update user]
    const updatedUser = await userRepository.updateUserByEmail(email, {
        isVerified: true
    });
    // 5 delete otp from db
    await otpRepository.deleteOtpByEmail(email);

    return updatedUser;
};

// login
export const login = async (email, password) => {
    // 1 check user existence
    const user = await authRepository.checkUserExistByEmail(email);
    if (!user) throw userNotExist;
    if (user.isVerified === false) throw userNotVerified;
    // 2 compare password
    const isPasswordMatched = await comparePassword(password,user['password'])
    if (!isPasswordMatched) throw invalidPassword;
    // 3 generate access token
    //{
    //             userId: user._id,
    //             email: user.email,
    //             name: user.name,
    //             isVerified: user.isVerified,
    //         },
    const token = await generateToken(
        {
                    userId: user._id,
                    email: user.email,
                    name: user.name,
                    isVerified: user.isVerified,
                },
    );
    // 4 return user
    return token;
};

// send otp
// send otp
export const sendOtp = async (email) => {
    // 1 check user existence
    const user = await authRepository.checkUserExistByEmail(email);
    if (!user) throw userNotExist;

    // 2 delete all old otps
    await otpRepository.deleteOtpByEmail(email);

    // 3 generate otp
    const otpCode = generateOTP();

    // 4 save otp into database with required email and expiration
    await otpRepository.createOtp({
        code: otpCode,
        email: email,
        expiresAt: new Date(Date.now() + toMs(5, "minutes")),
    });

    // 5 send otp email
    // 5 send reset password otp email
    await sendEmail(
        email,
        "Password Reset Request",
        getPasswordResetTemplate(otpCode)
    );
};

export const resetPassword = async (email,code,newPassword) => {
    /// 1.verify otp code
    const otp = await otpRepository.getOtpByEmail(email);
    if (!otp) throw otpExpired;
    if(otp.code !== code) throw invalidCode;
    ///2 hash password
    const hashedPassword = await hashPassword(newPassword);

    // 3. update user password
    await userRepository.updateUserByEmail(email,{
        password: hashedPassword
    });
    /// 4 delete otp
    await otpRepository.deleteOtpByEmail(email);
}



/// login with google
export const loginWithGoogle = async (idToken) => {
    //1. verify idToken
    const payload = await verifyGoogleToken(idToken);
    //3. check if user exists >> if exist generate token
    const user =await authRepository.checkUserExistByEmail(payload.email);
    if(user) {
        return generateToken(
            {
                userId: user._id,
                email: user.email,
            },
        );
    }
    //4. if not create user
    const createdUser = await authRepository.createUser({
        email: payload.email,
        name: payload.name,
        provider: 'google',
    });
    //5. login user and generate token
    return generateToken(
        {
            userId: createdUser._id,
            email: createdUser.email,
        },
    );
};

