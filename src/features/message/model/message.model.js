import mongoose, { Schema } from "mongoose";

const replySchema = new Schema(
    {
        content: { type: String, trim: true, minlength: 1, maxlength: 300, required: true },
        repliedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const messageSchema = new Schema(
    {
        content: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
        receiver: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        sender: { type: Schema.Types.ObjectId, ref: "User", default: null, select: false },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
        isFavorite: { type: Boolean, default: false },
        isArchived: { type: Boolean, default: false },
        isPublic: { type: Boolean, default: false },
        publishedAt: { type: Date, default: null },
        reply: { type: replySchema, default: null },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true } // option goes in the 2nd argument
);

// fast lookup of a user's inbox
messageSchema.index({ receiver: 1, isDeleted: 1, isArchived: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isDeleted: 1, isRead: 1 });
messageSchema.index({ receiver: 1, isPublic: 1, isDeleted: 1, publishedAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
