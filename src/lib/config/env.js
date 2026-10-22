// schema >> validate data process .env
import { z } from "zod";
import { config } from "dotenv";
config();

const booleanFromString = z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true");

export const envSchema = z
    .object({
        NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
        PORT: z.coerce.number().default(3000),
        MONGODB_URI: z.string().min(1),
        JWT_SECRET: z.string().min(1),
        ACCESS_TOKEN_EXPIRES_MINUTES: z.coerce.number().int().positive().default(15),
        REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
        CORS_ORIGINS: z.string().default("http://localhost:4200"),
        TRUST_PROXY: booleanFromString,

        EMAIL_PROVIDER: z.enum(["nodemailer", "mailjet"]).default("nodemailer"),
        MAIL_HOST: z.string().default("smtp.gmail.com"),
        MAIL_PORT: z.coerce.number().int().positive().default(587),
        MAIL_SECURE: booleanFromString,
        MAIL_USER: z.string().trim().toLowerCase().optional(),
        MAIL_PASS: z.string().optional(),

        GOOGLE_CLIENT_ID: z.string().min(1),
        UPSTASH_REDIS_REST_URL: z.string().min(1),
        UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
        FRONTEND_RESET_URL: z.string().optional(),

        // Mailjet
        MAILJET_API_KEY: z.string().optional(),
        MAILJET_SECRET_KEY: z.string().optional(),
        MAILJET_FROM_EMAIL: z.string().trim().optional(),
        MAILJET_FROM_NAME: z.string().default("UNSAID-APP"),
    })
    .superRefine((data, ctx) => {
        if (data.EMAIL_PROVIDER === "nodemailer" && (!data.MAIL_USER || !data.MAIL_PASS)) {
            ctx.addIssue({
                code: "custom",
                path: ["MAIL_USER"],
                message: "MAIL_USER and MAIL_PASS are required when EMAIL_PROVIDER=nodemailer",
            });
        }
        if (
            data.EMAIL_PROVIDER === "mailjet" &&
            (!data.MAILJET_API_KEY || !data.MAILJET_SECRET_KEY || !data.MAILJET_FROM_EMAIL)
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["MAILJET_API_KEY"],
                message: "MAILJET_API_KEY, MAILJET_SECRET_KEY and MAILJET_FROM_EMAIL are required when EMAIL_PROVIDER=mailjet",
            });
        }
    });

const result = envSchema.safeParse(process.env);

if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    console.error(JSON.stringify({ level: "error", message: "Invalid environment variables", issues }));
    process.exit(1);
}

const parsedEnv = result.data;

export const env = {
    nodeEnv: parsedEnv.NODE_ENV,
    isProduction: parsedEnv.NODE_ENV === "production",
    port: Number(parsedEnv.PORT),
    mongoURI: parsedEnv.MONGODB_URI,
    jwtSecret: parsedEnv.JWT_SECRET,
    accessTokenExpiresMinutes: parsedEnv.ACCESS_TOKEN_EXPIRES_MINUTES,
    refreshTokenExpiresDays: parsedEnv.REFRESH_TOKEN_EXPIRES_DAYS,
    corsOrigins: parsedEnv.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
    trustProxy: parsedEnv.TRUST_PROXY,

    emailProvider: parsedEnv.EMAIL_PROVIDER,
    mailHost: parsedEnv.MAIL_HOST,
    mailPort: parsedEnv.MAIL_PORT,
    mailSecure: parsedEnv.MAIL_SECURE,
    mailUser: parsedEnv.MAIL_USER,
    mailPass: parsedEnv.MAIL_PASS,

    googleClientId: parsedEnv.GOOGLE_CLIENT_ID,
    redisRestUrl: parsedEnv.UPSTASH_REDIS_REST_URL,
    redisRestToken: parsedEnv.UPSTASH_REDIS_REST_TOKEN,
    frontendResetUrl: parsedEnv.FRONTEND_RESET_URL,

    // Mailjet
    mailjetApiKey: parsedEnv.MAILJET_API_KEY,
    mailjetSecretKey: parsedEnv.MAILJET_SECRET_KEY,
    mailjetFromEmail: parsedEnv.MAILJET_FROM_EMAIL,
    mailjetFromName: parsedEnv.MAILJET_FROM_NAME,
};
