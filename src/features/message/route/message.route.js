import {Router} from "express";
import {sendMessageController} from "../controller/message.controller.js";
import {guard} from "../../../lib/auth/guard.js";

const messageRouter = Router();

messageRouter.post('/send-message',sendMessageController);
messageRouter.post('/public-send-message',guard,sendMessageController);



export default messageRouter;