import nodemailer from "nodemailer";

export class NodemailerProvider {
    transporter;
    fromEmail;
    fromName;

    constructor(config) {
        this.transporter = nodemailer.createTransport({
            host: config.host ?? "smtp.gmail.com",
            port: config.port ?? 587,
            secure: config.secure ?? false,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });
        this.fromEmail = config.fromEmail ?? config.user;
        this.fromName = config.fromName;
    }

    async sendMail(to, subject, html) {
        return this.transporter.sendMail({
            from: `"${this.fromName}" <${this.fromEmail}>`,
            to,
            subject,
            html,
        });
    }
}
