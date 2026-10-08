import { Router } from "express";
import { getAllMessageController, sendMessageController } from "../controller/message.controller.js";
import { authGuard } from "../../../lib/auth/guard.js";
import { idempotency } from "../../../lib/idempotency/idempotency.js";

const messageRouter = Router();

// anonymous: no guard, so sender is never stored
messageRouter.post("/send-anonymous", idempotency(3600), sendMessageController);

// logged-in sender: sender id is saved from the token
messageRouter.post("/send", authGuard, idempotency(3600), sendMessageController);

// my inbox
messageRouter.get("/", authGuard, getAllMessageController);

export default messageRouter;