import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../pkg/errors/error.js";

// Initialize client once outside the function scope
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


export const verifyGoogleToken = async (idToken) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        return ticket.getPayload();
    } catch (error) {
        throw new AppError("Invalid or expired Google Token", 401);
    }
};