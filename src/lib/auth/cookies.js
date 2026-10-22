import { env } from "../config/env.js";
import { toMs } from "../../pkg/utils/time.js";

const baseCookieOptions = () => ({
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
});

export const REFRESH_COOKIE_PATH = "/api/auth";

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
    res.cookie("access_token", accessToken, {
        ...baseCookieOptions(),
        maxAge: toMs(env.accessTokenExpiresMinutes, "minutes"),
    });
    res.cookie("refresh_token", refreshToken, {
        ...baseCookieOptions(),
        path: REFRESH_COOKIE_PATH,
        maxAge: toMs(env.refreshTokenExpiresDays, "days"),
    });
};

export const clearAuthCookies = (res) => {
    res.clearCookie("access_token", baseCookieOptions());
    res.clearCookie("refresh_token", { ...baseCookieOptions(), path: REFRESH_COOKIE_PATH });
};
