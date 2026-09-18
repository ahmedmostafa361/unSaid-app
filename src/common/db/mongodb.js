import mongoose from 'mongoose';
import { config } from 'dotenv';

config(); // Ensures .env is loaded before mongoose connects

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🍃 Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));