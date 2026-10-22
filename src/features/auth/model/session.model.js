import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        refreshTokenHash: { type: String, required: true },
        userAgent: { type: String, default: null, maxlength: 512 },
        ip: { type: String, default: null },
        lastUsedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
    },
    { timestamps: true }
);

export const Session = mongoose.model("Session", sessionSchema);
