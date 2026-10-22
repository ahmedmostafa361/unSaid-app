import { Router } from "express";
import * as messageController from "../controller/message.controller.js";
import { createIdentityRequestController } from "../controller/request.controller.js";
import { authGuard, optionalGuard } from "../../../lib/auth/guard.js";
import { idempotency } from "../../../lib/idempotency/idempotency.js";
import { rateLimit } from "../../../lib/rate-limit/rateLimit.js";
import { withCache } from "../../../lib/cache/withCache.js";
import { cacheKeys } from "../../../lib/cache/cache.service.js";
import { CACHE_TTL } from "../../../lib/config/constants.js";
import requestRouter from "./request.route.js";
import conversationRouter from "./conversation.route.js";

const messageRouter = Router();

const sendLimit = rateLimit({
    name: "send-message",
    windowSeconds: 600,
    max: 20,
    message: "You're sending messages too fast. Please slow down",
});

messageRouter.use("/requests", requestRouter);
messageRouter.use("/conversations", conversationRouter);

// logged-in sender: sender id is saved from the token
messageRouter.post("/send", optionalGuard, sendLimit, idempotency(3600), messageController.sendMessageController);
// anonymous: no guard, so sender is never stored
messageRouter.post(
    "/send-anonymous",
    optionalGuard,
    sendLimit,
    idempotency(3600),
    messageController.sendAnonymousMessageController
);

// my inbox
messageRouter.get("/", authGuard, messageController.getAllMessageController);
messageRouter.get("/unread-count", authGuard, messageController.getUnreadCountController);
messageRouter.patch("/read-all", authGuard, messageController.markAllReadController);
messageRouter.get("/sent", authGuard, messageController.getSentMessagesController);

messageRouter.get(
    "/public/:username",
    withCache({
        ttl: CACHE_TTL.publicMessages,
        namespace: (req) => cacheKeys.publicMessages(req.params.username),
    }),
    messageController.getPublicMessagesController
);

messageRouter.get("/:messageId", authGuard, messageController.getMessageController);
messageRouter.delete("/:messageId", authGuard, messageController.deleteMessageController);
messageRouter.patch("/:messageId/read", authGuard, messageController.markReadController);
messageRouter.patch("/:messageId/favorite", authGuard, messageController.toggleFavoriteController);
messageRouter.patch("/:messageId/archive", authGuard, messageController.toggleArchiveController);
messageRouter.patch("/:messageId/publish", authGuard, messageController.publishMessageController);
messageRouter.delete("/:messageId/publish", authGuard, messageController.unpublishMessageController);
messageRouter.post("/:messageId/report", authGuard, messageController.reportMessageController);
messageRouter.post("/:messageId/block-sender", authGuard, messageController.blockSenderController);
messageRouter.post("/:messageId/identity-request", authGuard, createIdentityRequestController);

export default messageRouter;
