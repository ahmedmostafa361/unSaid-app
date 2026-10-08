import {User} from "../model/user.model.js";

export const updateUserByEmail = async (email,updatedData) => {
  return await User.findOneAndUpdate(
        {
            email: email
        },
        updatedData,
        {
            returnDocument: "after"
        }
    );
}

export const findUserById = async (id) => {
    /// return User.findById(id); same but not variant
    return User.findOne(
        {
            _id: id, isDeleted: false
        },
        {
            password: 0
        }
    )
}