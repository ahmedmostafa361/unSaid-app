// src/lib/email/init.js
import { MailjetProvider } from '../../pkg/email/mailjet.js';
import { env } from '../config/env.js';

export const mailjetProvider = new MailjetProvider({
    apiKey: env.mailjetApiKey,
    apiSecret: env.mailjetSecretKey,
    fromEmail: env.mailjetFromEmail,
    fromName: env.mailjetFromName,
});

// same signature as your old nodemailer sendEmail, so it's a drop-in replacement
export const sendEmail = (to, subject, html) =>
    mailjetProvider.sendMail(to, subject, html);