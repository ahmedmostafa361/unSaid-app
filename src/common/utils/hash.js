// import bcrypt from "bcrypt"
import argon2 from "argon2"
export const hashPassword = (password) =>{
    return argon2.hash(
        password,
        {
            salt : 10
        }
    );
}

export const comparePassword = (password,hash) => argon2.verify(hash,password);