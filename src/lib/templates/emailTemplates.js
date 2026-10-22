import { baseEmailLayout } from "./emailLayout.js";
import { escapeHtml } from "../../pkg/utils/string.js";
import { AUTH_LIMITS, OTP_PURPOSES } from "../config/constants.js";

const heading = (text) =>
    `<h1 class="text-primary" style="margin: 0 0 12px 0; color: #f8fafc; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${escapeHtml(text)}</h1>`;

const paragraph = (text) =>
    `<p class="text-muted" style="margin: 0 0 24px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">${text}</p>`;

const note = (text) =>
    `<p class="text-muted" style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">${text}</p>`;

const codeBox = (code) => `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
      <tr>
        <td align="center">
          <div style="background: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px 24px; display: inline-block;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #38bdf8; letter-spacing: 8px;">${escapeHtml(code)}</span>
          </div>
        </td>
      </tr>
    </table>`;

const otpContent = {
    [OTP_PURPOSES.VERIFY_EMAIL]: {
        subject: "Verify your email",
        title: "Verify Your Email",
        intro: "Use the one-time code below to verify your email and activate your account.",
        ignore: "If you didn't create an account, you can safely ignore this email.",
    },
    [OTP_PURPOSES.RESET_PASSWORD]: {
        subject: "Password reset code",
        title: "Reset Your Password",
        intro: "We received a request to reset your password. Use the one-time code below to continue.",
        ignore: "If you didn't request a password reset, ignore this email. Your password stays the same.",
    },
    [OTP_PURPOSES.RESTORE_ACCOUNT]: {
        subject: "Restore your account",
        title: "Restore Your Account",
        intro: "Use the one-time code below to restore your deleted account.",
        ignore: "If you didn't ask to restore your account, you can ignore this email.",
    },
    [OTP_PURPOSES.ENABLE_TWO_STEP]: {
        subject: "Turn on 2-step verification",
        title: "Turn On 2-Step Verification",
        intro: "Use the one-time code below to turn on 2-step verification for your account.",
        ignore: "If this wasn't you, change your password right away.",
    },
    [OTP_PURPOSES.DISABLE_TWO_STEP]: {
        subject: "Turn off 2-step verification",
        title: "Turn Off 2-Step Verification",
        intro: "Use the one-time code below to turn off 2-step verification for your account.",
        ignore: "If this wasn't you, change your password right away.",
    },
    [OTP_PURPOSES.LOGIN_TWO_STEP]: {
        subject: "Your login code",
        title: "Confirm It's You",
        intro: "Someone entered your password and is trying to log in. Use the code below to finish logging in.",
        ignore: "If this wasn't you, change your password right away.",
    },
};

export const getOtpEmail = (purpose, otpCode) => {
    const content = otpContent[purpose];
    const bodyContent = `
    ${heading(content.title)}
    ${paragraph(content.intro)}
    ${codeBox(otpCode)}
    ${note(`This code expires in <strong>${AUTH_LIMITS.otpExpiresMinutes} minutes</strong> and can only be used once.`)}
    ${note(content.ignore)}
  `;

    return {
        subject: content.subject,
        html: baseEmailLayout({ title: content.title, bodyContent }),
    };
};

export const getPasswordResetTemplate = (otpCode) => getOtpEmail(OTP_PURPOSES.RESET_PASSWORD, otpCode).html;

export const getEmailVerificationTemplate = (otpCode) => getOtpEmail(OTP_PURPOSES.VERIFY_EMAIL, otpCode).html;

export const getAccountLockedEmail = (name, minutes) => {
    const bodyContent = `
    ${heading("Login Attempts Blocked")}
    ${paragraph(`Hi ${escapeHtml(name)}, we noticed ${AUTH_LIMITS.maxFailedLogins} failed login attempts on your account in a row. To protect you, logging in is paused for <strong>${minutes} minutes</strong>.`)}
    ${note("If this was you, wait a few minutes and try again, or reset your password.")}
    ${note("If this wasn't you, we recommend resetting your password and turning on 2-step verification.")}
  `;

    return {
        subject: "Suspicious login attempts on your account",
        html: baseEmailLayout({ title: "Login Attempts Blocked", bodyContent }),
    };
};

export const getPasswordChangedEmail = (name) => {
    const bodyContent = `
    ${heading("Your Password Was Changed")}
    ${paragraph(`Hi ${escapeHtml(name)}, the password for your account was just changed and you were logged out of your other devices.`)}
    ${note("If you didn't do this, reset your password right away.")}
  `;

    return {
        subject: "Your password was changed",
        html: baseEmailLayout({ title: "Your Password Was Changed", bodyContent }),
    };
};

export const getTwoStepStatusEmail = (name, enabled) => {
    const state = enabled ? "turned on" : "turned off";
    const bodyContent = `
    ${heading(`2-Step Verification ${enabled ? "On" : "Off"}`)}
    ${paragraph(`Hi ${escapeHtml(name)}, 2-step verification was ${state} for your account.`)}
    ${note("If you didn't do this, reset your password right away.")}
  `;

    return {
        subject: `2-step verification ${state}`,
        html: baseEmailLayout({ title: "2-Step Verification", bodyContent }),
    };
};

export const getIdentityRequestEmail = (name) => {
    const bodyContent = `
    ${heading("Someone Wants to Know It Was You")}
    ${paragraph(`Hi ${escapeHtml(name)}, someone you sent an anonymous message to is asking to see who sent it. Your identity stays hidden unless you accept.`)}
    ${note("Open the app to accept or reject the request.")}
  `;

    return {
        subject: "New identity request",
        html: baseEmailLayout({ title: "New Identity Request", bodyContent }),
    };
};
