import mongoose, { Schema } from "mongoose";
import { REPORT_REASONS } from "../../../lib/config/constants.js";

const reportSchema = new Schema(
    {
        message: { type: Schema.Types.ObjectId, ref: "Message", required: true },
        reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
        reason: { type: String, enum: REPORT_REASONS, required: true },
        details: { type: String, trim: true, maxlength: 500, default: "" },
        status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" },
    },
    { timestamps: true }
);

reportSchema.index({ message: 1, reporter: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

export const Report = mongoose.model("Report", reportSchema);
