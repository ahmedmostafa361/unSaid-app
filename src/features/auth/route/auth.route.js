import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import { idempotency } from "../../../lib/idempotency/idempotency.js";
import { authGuard } from "../../../lib/auth/guard.js";
import { byIpAndEmail, rateLimit } from "../../../lib/rate-limit/rateLimit.js";

const authRouter = Router();

const registerLimit = rateLimit({ name: "register", windowSeconds: 3600, max: 10 });
const loginLimit = rateLimit({ name: "login", windowSeconds: 900, max: 30 });
const otpLimit = rateLimit({ name: "otp", windowSeconds: 900, max: 5, identity: byIpAndEmail });
const codeLimit = rateLimit({ name: "verify-code", windowSeconds: 900, max: 20 });

authRouter.post("/register", registerLimit, authController.register);
authRouter.patch("/verify-account", codeLimit, authController.verifyAccount);
authRouter.post("/send-otp", otpLimit, authController.sendOtp);
authRouter.patch("/reset-password", codeLimit, idempotency(3600), authController.resetPasswordController);
authRouter.patch("/restore-account", codeLimit, authController.restoreAccount);

authRouter.post("/login", loginLimit, authController.login);
authRouter.post("/login/confirm", codeLimit, authController.confirmLogin);
authRouter.post("/login-with-google", loginLimit, authController.loginWithGoogle);
authRouter.post("/refresh-token", authController.refreshToken);

authRouter.post("/logout", authGuard, authController.logout);
authRouter.post("/logout-all", authGuard, authController.logoutAll);
authRouter.get("/sessions", authGuard, authController.listSessions);
authRouter.delete("/sessions/:sessionId", authGuard, authController.revokeSession);

authRouter.post("/two-step/enable", authGuard, authController.requestEnableTwoStep);
authRouter.patch("/two-step/verify", authGuard, codeLimit, authController.confirmEnableTwoStep);
authRouter.post("/two-step/disable", authGuard, authController.requestDisableTwoStep);
authRouter.patch("/two-step/disable/confirm", authGuard, codeLimit, authController.confirmDisableTwoStep);

export default authRouter;
