import { IdentityRequest } from "../model/identityRequest.model.js";
import { IDENTITY_REQUEST_STATUS } from "../../../lib/config/constants.js";

export const createRequest = async (data) => {
    return IdentityRequest.create(data);
};

export const findByMessage = async (messageId) => {
    return IdentityRequest.findOne({ message: messageId }).lean();
};

export const findByMessageIds = async (messageIds, requesterId) => {
    return IdentityRequest.find({ message: { $in: messageIds }, requester: requesterId })
        .select("message status conversation")
        .lean();
};

export const findByMessageIdsForSender = async (messageIds, senderId) => {
    return IdentityRequest.find({ message: { $in: messageIds }, sender: senderId })
        .select("message status")
        .lean();
};

export const findById = async (requestId) => {
    return IdentityRequest.findById(requestId).lean();
};

export const respond = async (requestId, senderId, status) => {
    return IdentityRequest.findOneAndUpdate(
        { _id: requestId, sender: senderId, status: IDENTITY_REQUEST_STATUS.PENDING },
        { $set: { status, respondedAt: new Date() } },
        { returnDocument: "after" }
    ).lean();
};

export const setConversation = async (requestId, conversationId) => {
    return IdentityRequest.findByIdAndUpdate(
        requestId,
        { $set: { conversation: conversationId } },
        { returnDocument: "after" }
    ).lean();
};

const listBy = async (filter, { status, page, limit }, populateRequester) => {
    const query = { ...filter, ...(status ? { status } : {}) };

    const finder = IdentityRequest.find(query)
        .select("-__v")
        .populate({ path: "message", select: "content createdAt" })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    if (populateRequester) {
        finder.populate({ path: "requester", select: "name username profilePicturePath" });
    }

    const [requests, total] = await Promise.all([finder.lean(), IdentityRequest.countDocuments(query)]);
    return { requests, total };
};

export const listForSender = async (senderId, options) => listBy({ sender: senderId }, options, true);

export const listForRequester = async (requesterId, options) => listBy({ requester: requesterId }, options, false);

export const countPendingForSender = async (senderId) => {
    return IdentityRequest.countDocuments({ sender: senderId, status: IDENTITY_REQUEST_STATUS.PENDING });
};
