import { User } from "../model/user.model.js";

export const PUBLIC_USER_FIELDS = "name username bio profilePicturePath coverImagePath createdAt";

export const updateUserByEmail = async (email, updatedData) => {
    return User.findOneAndUpdate({ email }, updatedData, { returnDocument: "after", runValidators: true });
};

export const updateUserById = async (id, updatedData) => {
    return User.findByIdAndUpdate(id, updatedData, { returnDocument: "after", runValidators: true });
};

export const findUserById = async (id) => {
    /// return User.findById(id); same but not variant
    return User.findOne({ _id: id, isDeleted: false });
};

export const findUserByIdWithPassword = async (id) => {
    return User.findOne({ _id: id, isDeleted: false }).select("+password");
};

export const findUserByEmail = async (email, { withPassword = false } = {}) => {
    const query = User.findOne({ email });
    return withPassword ? query.select("+password") : query;
};

export const findActiveUserByUsername = async (username) => {
    return User.findOne({ username: String(username).toLowerCase(), isDeleted: false, isVerified: true });
};

export const usernameExists = async (username, excludeUserId) => {
    const filter = { username: String(username).toLowerCase() };
    if (excludeUserId) filter._id = { $ne: excludeUserId };
    return Boolean(await User.exists(filter));
};

export const findPublicUsersByIds = async (ids) => {
    return User.find({ _id: { $in: ids } }).select(`${PUBLIC_USER_FIELDS} isDeleted`).lean();
};

export const searchUsers = async ({ query, excludeIds = [], page, limit }) => {
    const filter = {
        isDeleted: false,
        isVerified: true,
        _id: { $nin: excludeIds },
        $or: [{ username: { $regex: `^${query}`, $options: "i" } }, { name: { $regex: query, $options: "i" } }],
    };

    const [users, total] = await Promise.all([
        User.find(filter)
            .select(PUBLIC_USER_FIELDS)
            .sort({ username: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        User.countDocuments(filter),
    ]);

    return { users, total };
};

export const listUsers = async ({ page, limit, includeDeleted }) => {
    const filter = includeDeleted ? {} : { isDeleted: false };
    const [users, total] = await Promise.all([
        User.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        User.countDocuments(filter),
    ]);

    return {
        users: users.map(({ password, __v, ...user }) => user),
        total,
    };
};
