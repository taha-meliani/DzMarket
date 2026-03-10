import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "dev_secret_only",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  nodeEnv: process.env.NODE_ENV || "development",
  passwordResetCodeTtlMinutes: Number(process.env.PASSWORD_RESET_CODE_TTL_MINUTES || 15),
  passwordResetMaxAttempts: Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS || 5),
  passwordResetMinRequestIntervalSeconds: Number(process.env.PASSWORD_RESET_MIN_REQUEST_INTERVAL_SECONDS || 60),
  emailApiKey: process.env.RESEND_API_KEY || "",
  emailFromAddress: process.env.RESET_EMAIL_FROM || "",
};
