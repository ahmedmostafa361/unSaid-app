import * as otpRepository from "../repository/otp.repo.js";
import { env } from "../../../lib/config/env.js";
import { AUTH_LIMITS } from "../../../lib/config/constants.js";
import { generateOTP } from "../../../lib/utils/otp.js";
import { hmacHash } from "../../../pkg/utils/hash.js";
import { addTime } from "../../../pkg/utils/time.js";
import { sendEmail } from "../../../lib/email/init.js";
import { getOtpEmail } from "../../../lib/templates/emailTemplates.js";
import { invalidCode, otpExpired, otpResendCooldown, tooManyOtpAttempts } from "../errors.js";

const hashCode = (email, purpose, code) => hmacHash(`${email}:${purpose}:${code}`, env.jwtSecret);

const cooldownRemaining = (otp) => {
    if (!otp || otp.expiresAt <= new Date()) return 0;
    const elapsedSeconds = Math.floor((Date.now() - new Date(otp.sentAt).getTime()) / 1000);
    return Math.max(AUTH_LIMITS.otpResendCooldownSeconds - elapsedSeconds, 0);
};

export const sendOtpEmail = async (email, purpose, { skipIfCoolingDown = false } = {}) => {
    const existing = await otpRepository.getOtp(email, purpose);
    const remaining = cooldownRemaining(existing);

    if (remaining > 0) {
        if (skipIfCoolingDown) {
            return { sent: false, retryAfterSeconds: remaining };
        }
        throw otpResendCooldown(remaining);
    }

    const code = generateOTP();
    await otpRepository.upsertOtp({
        email,
        purpose,
        codeHash: hashCode(email, purpose, code),
        expiresAt: addTime(AUTH_LIMITS.otpExpiresMinutes, "minutes"),
    });

    const { subject, html } = getOtpEmail(purpose, code);

    try {
        await sendEmail(email, subject, html);
    } catch (error) {
        await otpRepository.deleteOtp(email, purpose);
        throw error;
    }

    return { sent: true, expiresInMinutes: AUTH_LIMITS.otpExpiresMinutes };
};

export const verifyOtp = async (email, purpose, code) => {
    const codeHash = hashCode(email, purpose, code);

    const consumed = await otpRepository.consumeOtp({
        email,
        purpose,
        codeHash,
        maxAttempts: AUTH_LIMITS.otpMaxAttempts,
    });
    if (consumed) return true;

    const otp = await otpRepository.getOtp(email, purpose);

    if (!otp || otp.expiresAt <= new Date()) {
        if (otp) await otpRepository.deleteOtp(email, purpose);
        throw otpExpired();
    }

    if (otp.attempts >= AUTH_LIMITS.otpMaxAttempts) {
        await otpRepository.deleteOtp(email, purpose);
        throw tooManyOtpAttempts();
    }

    const updated = await otpRepository.incrementOtpAttempts(otp._id);
    const attemptsLeft = AUTH_LIMITS.otpMaxAttempts - (updated?.attempts ?? AUTH_LIMITS.otpMaxAttempts);

    if (attemptsLeft <= 0) {
        await otpRepository.deleteOtp(email, purpose);
        throw tooManyOtpAttempts();
    }

    throw invalidCode(attemptsLeft);
};
