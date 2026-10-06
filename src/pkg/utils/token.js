import jwt from "jsonwebtoken";
import {toMs} from "./time.js";
import {env} from "../../lib/config/env.js";
/// generate token
export const generateToken = (payload) =>{
    return jwt.sign(
        payload
        ,env.jwtSecret,
        {
            expiresIn: toMs(1, "hours")
        });
}