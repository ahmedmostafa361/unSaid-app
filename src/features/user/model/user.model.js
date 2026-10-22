// schema
///# DATABASE DESIGN
//
// * User
//
// - name -> [String - required - minlength:3 - maxlength:20 - trim:true]
// - email -> [String - required - unique:true - trim:true - lowercase:true]
// - password -> [String - in-case provider = local >> required]
// - provider [Google - Facebook - 'local']
// - isDeleted [boolean] – [default: false]
// - isVerified [boolean] – [default: false]
// - dob [Date]
// - gender [String] - [Male - Female]
// - createdAt [Date]
// - updatedAt [Date]

import mongoose, { Schema } from "mongoose";
import { USER_ROLES } from "../../../lib/config/constants.js";

const settingsSchema = new Schema(
    {
        acceptMessages: { type: Boolean, default: true },
        allowGuestMessages: { type: Boolean, default: true },
        showPublicMessages: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
    },
    { _id: false }
);

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 20,
            trim: true,
        },
        username: {
            type: String,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 30,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            select: false,
            required: function () {
                return this.provider === "local"; // true in case of local provider
            },
        },
        provider: {
            type: String,
            enum: ["local", "google", "facebook"],
            default: "local",
        },
        role: {
            type: String,
            enum: Object.values(USER_ROLES),
            default: USER_ROLES.USER,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        twoStepEnabled: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        dob: {
            type: Date,
        },
        gender: {
            type: String,
            enum: ["Male", "Female"],
        },
        bio: {
            type: String,
            trim: true,
            maxlength: 160,
            default: "",
        },
        profilePicturePath: {
            type: String,
            default: null,
        },
        coverImagePath: [String],
        cvPath: String,
        settings: {
            type: settingsSchema,
            default: () => ({}),
        },
        passwordChangedAt: Date,
        lastLoginAt: Date,
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    }
);

userSchema.index(
    { username: 1 },
    { unique: true, partialFilterExpression: { username: { $type: "string" } } }
);
userSchema.index({ isDeleted: 1, name: 1 });

// model
export const User = mongoose.model("User", userSchema);
