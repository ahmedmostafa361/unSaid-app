// schema for otp
/*
* * OTP [one-time password]

- code -> [String - required - length:6]
- email -> [String - required - trim:true - lowercase:true]
- expiresAt -> [Date] 2026-09-14T08:20:00.000Z
- createdAt -> [Date] 2026-09-14T08:10:00.000Z
* */
import mongoose, { Schema } from "mongoose";
import { OTP_PURPOSES } from "../../../lib/config/constants.js";

const otpSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        purpose: {
            type: String,
            required: true,
            enum: Object.values(OTP_PURPOSES),
        },
        codeHash: {
            type: String,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        sentAt: {
            type: Date,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    }
);

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

export const OTP = mongoose.model("OTP", otpSchema);
