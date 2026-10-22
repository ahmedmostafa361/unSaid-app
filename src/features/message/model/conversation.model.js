import mongoose, { Schema } from "mongoose";

const lastMessageSchema = new Schema(
    {
        content: String,
        sender: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: Date,
    },
    { _id: false }
);

const conversationSchema = new Schema(
    {
        participants: {
            type: [{ type: Schema.Types.ObjectId, ref: "User" }],
            validate: {
                validator: (value) => value.length === 2,
                message: "A conversation must have exactly two participants",
            },
        },
        message: { type: Schema.Types.ObjectId, ref: "Message", required: true, unique: true },
        identityRequest: { type: Schema.Types.ObjectId, ref: "IdentityRequest", required: true },
        lastMessage: { type: lastMessageSchema, default: null },
        lastActivityAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

conversationSchema.index({ participants: 1, lastActivityAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
