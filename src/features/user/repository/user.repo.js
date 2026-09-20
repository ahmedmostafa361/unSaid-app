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