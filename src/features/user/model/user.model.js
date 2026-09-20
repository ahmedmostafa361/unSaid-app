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

import mongoose, {Schema} from "mongoose"
const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 20,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: function (){
                return this.provider === 'local'; // true in case of local provider
            }
        },

        provider: {
            type: String,
            enum: ['local', 'google', 'facebook'],
            default: 'local'
        },

        isDeleted: {
            type: Boolean,
            default: false
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        dob: {
            type: Date
        },
        gender: {
            type: String,
            enum: ['Male', 'Female'],
            default: 'Male'
        },
    }
    ,{
        timestamps: true
    }
);
// model
export const User = mongoose.model('User', userSchema);