import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema(
    {
        conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
        readAt: { type: Date, default: null },
        isEdited: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

chatMessageSchema.index({ conversation: 1, createdAt: -1 });
chatMessageSchema.index({ conversation: 1, sender: 1, readAt: 1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
