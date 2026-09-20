import nodemailer from 'nodemailer';
import 'dotenv/config';

// 1. Create the transporter instance
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS requiring STARTTLS
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// 2. Export a reusable function to send emails
export const sendEmail = async (to, subject, html) => {
    return await transporter.sendMail({
        from: `"UNSAID-APP" <${process.env.MAIL_USER}>`,
        to: to,
        subject: subject,
        html: html
    });
};