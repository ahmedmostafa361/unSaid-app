import mongoose from 'mongoose';
import { config } from 'dotenv';
import {logger} from '../logger/logger.js';
config(); // Ensures .env is loaded before mongoose connects

mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info("🍃 Connected to MongoDB"))
    .catch((err) => logger.error(
        " MongoDB connection error. Please make sure MongoDB is running. " + err
    ));