import { env } from "../config/env.js";

function getResetPasswordEmailHtml({ code }) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2>Password Reset Code</h2>
      <p>Use this verification code to reset your password:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
      <p>This code expires in 15 minutes.</p>
      <p>If you did not request a password reset, ignore this email.</p>
    </div>
  `;
}

export async function sendPasswordResetCodeEmail({ toEmail, code }) {
  if (!env.emailApiKey || !env.emailFromAddress) {
    if (env.nodeEnv !== "production") {
      console.log(`[password-reset][dev] email=${toEmail} code=${code}`);
      return;
    }
    const err = new Error("Email service is not configured");
    err.status = 500;
    throw err;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.emailApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.emailFromAddress,
      to: [toEmail],
      subject: "DzMarket Password Reset Code",
      html: getResetPasswordEmailHtml({ code }),
    }),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    const err = new Error(`Failed to send reset email${payload ? `: ${payload}` : ""}`);
    err.status = 502;
    throw err;
  }
}
