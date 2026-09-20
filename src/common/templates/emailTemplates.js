import { baseEmailLayout } from "./emailLayout.js";

export const getPasswordResetTemplate = (otpCode) => {
    const bodyContent = `
    <h1 class="text-primary" style="margin: 0 0 12px 0; color: #f8fafc; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Reset Your Password</h1>
    <p class="text-muted" style="margin: 0 0 32px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
      We received a request to reset your password. Use the One-Time Password (OTP) below to proceed.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
      <tr>
        <td align="center">
          <div style="background: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px 24px; display: inline-block;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #38bdf8; letter-spacing: 8px;">${otpCode}</span>
          </div>
        </td>
      </tr>
    </table>
    <p class="text-muted" style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
      This code will expire in <strong>5 minutes</strong>.
    </p>
    <p class="text-muted" style="margin: 0; color: #64748b; font-size: 13px;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `;

    return baseEmailLayout({
        title: "Reset Your Password",
        bodyContent,
    });
};

export const getEmailVerificationTemplate = (otpCode) => {
    const bodyContent = `
    <h1 class="text-primary" style="margin: 0 0 12px 0; color: #f8fafc; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Verify Your Email</h1>
    <p class="text-muted" style="margin: 0 0 32px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
      Please use the One-Time Password (OTP) below to complete your verification process.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
      <tr>
        <td align="center">
          <div style="background: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px 24px; display: inline-block;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #38bdf8; letter-spacing: 8px;">${otpCode}</span>
          </div>
        </td>
      </tr>
    </table>
    <p class="text-muted" style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
      This code will expire in <strong>10 minutes</strong>.
    </p>
    <p class="text-muted" style="margin: 0; color: #64748b; font-size: 13px;">
      If you didn't request this code, you can safely ignore this email.
    </p>
  `;

    return baseEmailLayout({
        title: "Email Verification",
        bodyContent,
    });
};