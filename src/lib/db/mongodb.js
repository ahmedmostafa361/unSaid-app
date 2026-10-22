import mongoose from 'mongoose';
import { logger } from '../../pkg/logger/logger.js';
import { env } from '../config/env.js';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose
    .connect(env.mongoURI)
    .then(() => logger.info('🍃 Connected to MongoDB'))
    .catch((err) =>
        logger.error('MongoDB connection error. Make sure MongoDB is running. ' + err)
    );