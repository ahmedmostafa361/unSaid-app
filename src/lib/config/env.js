// schema >> validate data process .env
import { z } from 'zod';
import { config } from 'dotenv';
config();

export const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    MONGODB_URI: z.string(),
    JWT_SECRET: z.string(),
    MAIL_USER: z.string().trim().toLowerCase(),
    MAIL_PASS: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    UPSTASH_REDIS_REST_URL: z.string(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
    FRONTEND_RESET_URL: z.string(),

    // Mailjet
    MAILJET_API_KEY: z.string().min(1),
    MAILJET_SECRET_KEY: z.string().min(1),
    MAILJET_FROM_EMAIL: z.string().trim().email(),
    MAILJET_FROM_NAME: z.string().default('UNSAID-APP'),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
    port: Number(parsedEnv.PORT),
    mongoURI: parsedEnv.MONGODB_URI,
    jwtSecret: parsedEnv.JWT_SECRET,
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