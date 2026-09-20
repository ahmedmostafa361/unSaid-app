// schema for otp
/*
* * OTP [one-time password]

- code -> [String - required - length:6]
- email -> [String - required - trim:true - lowercase:true]
- expiresAt -> [Date] 2026-09-14T08:20:00.000Z
- createdAt -> [Date] 2026-09-14T08:10:00.000Z
* */
import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
            length: 6
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    }
);

export const OTP = mongoose.model('OTP', otpSchema);