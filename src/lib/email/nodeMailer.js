import nodemailer from 'nodemailer';
import 'dotenv/config';
import {env} from "../config/env.js";

// 1. Create the transporter instance
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS requiring STARTTLS
    auth: {
        user: env.mailUser,
        pass: env.mailPass
    }
});

// 2. Export a reusable function to send emails
export const sendEmail = async (to, subject, html) => {
    return await transporter.sendMail({
        from: `"UNSAID-APP" <${env.mailUser}>`,
        to: to,
        subject: subject,
        html: html
    });
};