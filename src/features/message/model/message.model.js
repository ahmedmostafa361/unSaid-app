//schema for message

/*
*
* Message

- content -> [String - required - trim:true - minlength:1 - maxlength:200]
- receiver -> [ObjectId - required - ref:'User']
- sender -> [ObjectId - ref:'User']
- isDeleted -> [boolean] – [default: false]
- createdAt -> [Date]
- updatedAt -> [Date]
*/
import mongoose, {Schema} from "mongoose";

const messageSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 200
        },
        receiver: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        timestamps : true
    }
);

// model
export const Message = mongoose.model('Message', messageSchema);