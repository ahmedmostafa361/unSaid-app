import { Router } from "express";
import * as conversationController from "../controller/conversation.controller.js";
import { authGuard } from "../../../lib/auth/guard.js";
import { idempotency } from "../../../lib/idempotency/idempotency.js";
import { rateLimit } from "../../../lib/rate-limit/rateLimit.js";

const conversationRouter = Router();

const chatLimit = rateLimit({ name: "chat-message", windowSeconds: 60, max: 60 });

conversationRouter.use(authGuard);

conversationRouter.get("/", conversationController.listConversationsController);
conversationRouter.get("/:conversationId", conversationController.getConversationController);
conversationRouter.get("/:conversationId/messages", conversationController.getChatMessagesController);
conversationRouter.post(
    "/:conversationId/messages",
    chatLimit,
    idempotency(3600, { required: false }),
    conversationController.sendChatMessageController
);
conversationRouter.patch(
    "/:conversationId/messages/:chatMessageId",
    conversationController.editChatMessageController
);
conversationRouter.delete(
    "/:conversationId/messages/:chatMessageId",
    conversationController.deleteChatMessageController
);

export default conversationRouter;
