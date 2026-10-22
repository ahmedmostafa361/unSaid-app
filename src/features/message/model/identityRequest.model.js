import mongoose, { Schema } from "mongoose";
import { IDENTITY_REQUEST_STATUS } from "../../../lib/config/constants.js";

const identityRequestSchema = new Schema(
    {
        message: { type: Schema.Types.ObjectId, ref: "Message", required: true, unique: true },
        requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: Object.values(IDENTITY_REQUEST_STATUS),
            default: IDENTITY_REQUEST_STATUS.PENDING,
        },
        note: { type: String, trim: true, maxlength: 150, default: "" },
        respondedAt: { type: Date, default: null },
        conversation: { type: Schema.Types.ObjectId, ref: "Conversation", default: null },
    },
    { timestamps: true }
);

identityRequestSchema.index({ sender: 1, status: 1, createdAt: -1 });
identityRequestSchema.index({ requester: 1, status: 1, createdAt: -1 });

export const IdentityRequest = mongoose.model("IdentityRequest", identityRequestSchema);
