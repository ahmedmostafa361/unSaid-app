import { User } from "../../user/model/user.model.js";

export const checkUserExistByEmail = async (email) => {
    return User.findOne({ email }).select("+password");
};

export const createUser = async (userData) => {
    return User.create(userData);
};
