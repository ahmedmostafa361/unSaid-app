// src/lib/email/init.js
import { env } from "../config/env.js";
import { MailjetProvider } from "../../pkg/email/mailjet.js";
import { NodemailerProvider } from "../../pkg/email/nodemailer.js";
import { logger } from "../../pkg/logger/logger.js";
import { AppError } from "../errors/error.js";

const createProvider = () => {
    if (env.emailProvider === "mailjet") {
        return new MailjetProvider({
            apiKey: env.mailjetApiKey,
            apiSecret: env.mailjetSecretKey,
            fromEmail: env.mailjetFromEmail,
            fromName: env.mailjetFromName,
        });
    }

    return new NodemailerProvider({
        host: env.mailHost,
        port: env.mailPort,
        secure: env.mailSecure,
        user: env.mailUser,
        pass: env.mailPass,
        fromName: env.mailjetFromName,
    });
};

export const emailProvider = createProvider();

// same signature as your old nodemailer sendEmail, so it's a drop-in replacement
export const sendEmail = async (to, subject, html) => {
    try {
        return await emailProvider.sendMail(to, subject, html);
    } catch (err) {
        logger.error("Email sending failed", { to, subject, error: err.message });
        throw new AppError("We couldn't send the email right now. Please try again shortly", 503, {
            code: "EMAIL_FAILED",
        });
    }
};

export const sendEmailInBackground = (to, subject, html) => {
    sendEmail(to, subject, html).catch(() => {});
};
