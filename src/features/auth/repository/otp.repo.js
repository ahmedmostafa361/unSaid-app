import { OTP } from "../model/otp.model.js";

export const upsertOtp = async ({ email, purpose, codeHash, expiresAt }) => {
    return OTP.findOneAndUpdate(
        { email, purpose },
        { $set: { codeHash, expiresAt, attempts: 0, sentAt: new Date() } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
};

export const consumeOtp = async ({ email, purpose, codeHash, maxAttempts }) => {
    return OTP.findOneAndDelete({
        email,
        purpose,
        codeHash,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: maxAttempts },
    });
};

export const getOtp = async (email, purpose) => {
    return OTP.findOne({ email, purpose });
};

export const incrementOtpAttempts = async (id) => {
    return OTP.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { returnDocument: "after" });
};

export const deleteOtp = async (email, purpose) => {
    return OTP.deleteOne({ email, purpose });
};

export const deleteOtpByEmail = async (email) => {
    return OTP.deleteMany({ email });
};
