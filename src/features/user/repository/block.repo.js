import { Block } from "../model/block.model.js";

export const upsertBlock = async ({ blocker, blocked, fromMessage = null, isAnonymous = false }) => {
    const update = isAnonymous
        ? { $setOnInsert: { blocker, blocked, fromMessage, isAnonymous: true } }
        : { $set: { isAnonymous: false }, $setOnInsert: { blocker, blocked, fromMessage } };

    return Block.findOneAndUpdate({ blocker, blocked }, update, { upsert: true, returnDocument: "after" });
};

export const deleteBlock = async (blocker, blocked) => {
    return Block.findOneAndDelete({ blocker, blocked });
};

export const deleteBlockById = async (blocker, blockId) => {
    return Block.findOneAndDelete({ _id: blockId, blocker });
};

export const isBlocked = async (blocker, blocked) => {
    if (!blocker || !blocked) return false;
    return Boolean(await Block.exists({ blocker, blocked }));
};

export const isEitherBlocked = async (userA, userB) => {
    return Boolean(
        await Block.exists({
            $or: [
                { blocker: userA, blocked: userB },
                { blocker: userB, blocked: userA },
            ],
        })
    );
};

export const findUserIdsWhoBlocked = async (userId) => {
    const blocks = await Block.find({ blocked: userId }).select("blocker").lean();
    return blocks.map((block) => block.blocker);
};

export const findBlocksByBlocker = async (blocker, { page, limit }) => {
    const filter = { blocker };
    const [blocks, total] = await Promise.all([
        Block.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({ path: "blocked", select: "name username profilePicturePath" })
            .populate({ path: "fromMessage", select: "content createdAt" })
            .lean(),
        Block.countDocuments(filter),
    ]);

    return { blocks, total };
};
