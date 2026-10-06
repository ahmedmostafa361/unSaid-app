import mongoose from 'mongoose';
import { config } from 'dotenv';
import {logger} from '../../pkg/logger/logger.js';
import {env} from "../config/env.js";
config(); // Ensures .env is loaded before mongoose connects

mongoose.connect(env.mongoURI)
    .then(() => logger.info("🍃 Connected to MongoDB"))
    .catch((err) => logger.error(
        " MongoDB connection error. Please make sure MongoDB is running. " + err
    ));