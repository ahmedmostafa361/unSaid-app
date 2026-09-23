import 'dotenv/config';
import express from 'express';
import "./common/db/mongodb.js";
import userRoutes from './features/user/route/user.route.js';
import messageRouter from './features/message/route/message.route.js';
import authRouter from './features/auth/route/auth.route.js';
import {OTP} from "./features/auth/model/otp.model.js";

const app = express();

app.use(express.json());

app.use('/auth', authRouter);
app.use('/messages', messageRouter);
app.use('/user', userRoutes); // Fixed variable reference

/// handle invalid routes
app.use((req, res, next) => {
    res.status(404).json({ message: "Invalid route", success: false });
});

/// handle global errors
app.use((err, req, res, next) => {
    console.log(err);
    if (err.isOperational === true) {  /// to handle our custom errors we did
        return res.status(err.statusCode).json({
            message: err.message,
            success: false,
            stack: err.stack
        });
    }
    return res.status(500).json({
        message: "Something went wrong",
        success: false,
    })
});
app.listen(3000, () => console.log('🚀 Server running on port 3000'));
