export const OTP_PURPOSES = Object.freeze({
    VERIFY_EMAIL: "verify-email",
    RESET_PASSWORD: "reset-password",
    RESTORE_ACCOUNT: "restore-account",
    ENABLE_TWO_STEP: "enable-two-step",
    DISABLE_TWO_STEP: "disable-two-step",
    LOGIN_TWO_STEP: "login-two-step",
});

export const AUTH_LIMITS = Object.freeze({
    maxFailedLogins: 5,
    lockMinutes: 5,
    failedLoginsWindowHours: 24,
    otpExpiresMinutes: 10,
    otpMaxAttempts: 5,
    otpResendCooldownSeconds: 60,
});

export const ACCOUNT_RESTORE_DAYS = 30;

export const USER_ROLES = Object.freeze({
    USER: "user",
    ADMIN: "admin",
});

export const IDENTITY_REQUEST_STATUS = Object.freeze({
    PENDING: "pending",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
});

export const REPORT_REASONS = Object.freeze(["spam", "harassment", "hate", "threat", "other"]);

export const CACHE_TTL = Object.freeze({
    publicProfile: 600,
    publicMessages: 300,
});
