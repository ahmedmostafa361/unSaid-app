import * as requestService from "../service/request.service.js";
import { validateBody } from "../../../lib/validation/validation.js";
import {
    createIdentityRequestDto,
    listRequestsQueryDto,
    messageIdParamsDto,
    requestIdParamsDto,
    respondRequestDto,
} from "../dto/message.dto.js";

export const createIdentityRequestController = async (req, res) => {
    const { messageId } = validateBody(messageIdParamsDto, req.params);
    const { note } = validateBody(createIdentityRequestDto, req.body);
    const data = await requestService.createIdentityRequest(req.user.userId, messageId, note);
    res.status(201).json({
        message: "Request sent. The sender will decide whether to reveal who they are",
        success: true,
        data,
    });
};

export const getReceivedRequestsController = async (req, res) => {
    const query = validateBody(listRequestsQueryDto, req.query);
    const { requests, pagination } = await requestService.getReceivedRequests(req.user.userId, query);
    res.status(200).json({ message: "Requests received", success: true, data: requests, pagination });
};

export const getSentRequestsController = async (req, res) => {
    const query = validateBody(listRequestsQueryDto, req.query);
    const { requests, pagination } = await requestService.getSentRequests(req.user.userId, query);
    res.status(200).json({ message: "Requests sent", success: true, data: requests, pagination });
};

export const getPendingCountController = async (req, res) => {
    const data = await requestService.getPendingCount(req.user.userId);
    res.status(200).json({ message: "Pending requests count", success: true, data });
};

export const respondToRequestController = async (req, res) => {
    const { requestId } = validateBody(requestIdParamsDto, req.params);
    const { action } = validateBody(respondRequestDto, req.body);
    const data = await requestService.respondToRequest(req.user.userId, requestId, action);
    res.status(200).json({
        message:
            action === "accept"
                ? "Request accepted. Your identity is now visible and a conversation was created"
                : "Request rejected. Your identity stays hidden",
        success: true,
        data,
    });
};
