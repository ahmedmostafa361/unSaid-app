import { Router } from "express";
import * as requestController from "../controller/request.controller.js";
import { authGuard } from "../../../lib/auth/guard.js";

const requestRouter = Router();

requestRouter.use(authGuard);

requestRouter.get("/received", requestController.getReceivedRequestsController);
requestRouter.get("/received/pending-count", requestController.getPendingCountController);
requestRouter.get("/sent", requestController.getSentRequestsController);
requestRouter.patch("/:requestId", requestController.respondToRequestController);

export default requestRouter;
