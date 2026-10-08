import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        content: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
        receiver: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        sender: { type: Schema.Types.ObjectId, ref: "User" },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true } // option goes in the 2nd argument
);

// fast lookup of a user's inbox
messageSchema.index({ receiver: 1, isDeleted: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);