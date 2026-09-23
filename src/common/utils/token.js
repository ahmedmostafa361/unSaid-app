import jwt from "jsonwebtoken";
import {toMs} from "./time.js";
/// generate token
export const generateToken = (payload) =>{
    return jwt.sign(
        payload
        ,process.env.JWT_SECRET,
        {
            expiresIn: toMs(1, "hours")
        });
}