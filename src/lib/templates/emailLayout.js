export const baseEmailLayout = ({ title, bodyContent }) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0b0f19 !important; }
      .card-bg { background-color: #1e293b !important; border-color: #334155 !important; }
      .text-primary { color: #f8fafc !important; }
      .text-muted { color: #94a3b8 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-bg" style="background-color: #0f172a; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);" class="card-bg">
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899); border-top-left-radius: 16px; border-top-right-radius: 16px;"></td>
          </tr>
          <tr>
            <td style="padding: 40px 32px; text-align: center;">
              <div style="display: inline-block; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); padding: 10px 20px; border-radius: 30px; margin-bottom: 24px;">
                <span style="color: #818cf8; font-weight: 700; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">UNSAID APP</span>
              </div>
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 24px 0 0 0; color: #475569; font-size: 12px;">
                &copy; ${new Date().getFullYear()} UNSAID APP. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};