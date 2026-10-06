import 'dotenv/config';
import express from 'express';
import "./lib/db/mongodb.js";
import cors from 'cors';
import {globalErrorHandler} from "./lib/errors/error.handler.js";
import {router} from "./routes.js";

export function createApp(){

    const app = express();

    app.use(cors('http://localhost:4200'));
    app.use(express.json());
    app.use('/api',router);

/// handle invalid routes
    app.use((req, res, next) => {
        res.status(404).json({ message: "Invalid route", success: false });
    });

/// handle global errors
    app.use(globalErrorHandler);
    return app;
}