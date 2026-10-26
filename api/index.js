import { createApp } from "../src/app.js";
import { connectDB } from "../src/lib/db/mongodb.js";

const app = createApp();

export default async function handler(req, res) {
    try {
        await connectDB();
    } catch {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "Database is unavailable. Please try again shortly", success: false }));
        return;
    }
    return app(req, res);
}
