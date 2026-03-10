import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../config/env.js";
import { passwordResetModel } from "../models/password-reset.model.js";
import { userModel } from "../models/user.model.js";
import { sendPasswordResetCodeEmail } from "./email.service.js";
import { signToken } from "../utils/jwt.js";
import { normalizeAdminPermissions } from "../utils/admin-permissions.js";

const USERNAME_REGEX = /^\S{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.com$/i;
const PHONE_REGEX = /^(05|06|07)\d{8}$/;
const RESET_CODE_REGEX = /^\d{6}$/;

function effectiveAdminPermissions(role, permissions) {
  if (role !== "ADMIN") return [];
  return normalizeAdminPermissions(permissions);
}

export async function registerUser(payload) {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedUsername = payload.username.trim();
  const normalizedPhone = String(payload.phone || "").trim();
  const normalizedFirstName = String(payload.firstName || "").trim();
  const normalizedLastName = String(payload.lastName || "").trim();
  const normalizedGender = payload.gender;
  const normalizedBirthDate = String(payload.birthDate || "").trim();
  if (!USERNAME_REGEX.test(normalizedUsername)) {
    const err = new Error("Username must be 3-20 characters with no spaces");
    err.status = 400;
    throw err;
  }
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    const err = new Error("Email must end with .com");
    err.status = 400;
    throw err;
  }
  if (payload.password.trim().length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.status = 400;
    throw err;
  }
  if (!PHONE_REGEX.test(normalizedPhone)) {
    const err = new Error("Invalid phone number");
    err.status = 400;
    throw err;
  }
  if (!normalizedFirstName || !normalizedLastName) {
    const err = new Error("First and last name are required");
    err.status = 400;
    throw err;
  }
  if (normalizedGender !== "male" && normalizedGender !== "female") {
    const err = new Error("Gender is required");
    err.status = 400;
    throw err;
  }
  const birthDate = new Date(normalizedBirthDate);
  if (Number.isNaN(birthDate.getTime())) {
    const err = new Error("Invalid birth date");
    err.status = 400;
    throw err;
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  if (age < 18 || age > 100) {
    const err = new Error("Age must be between 18 and 100");
    err.status = 400;
    throw err;
  }

  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing) {
    const err = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  const existingUsername = await userModel.findByUsernameInsensitive(normalizedUsername);
  if (existingUsername) {
    const err = new Error("Username already in use");
    err.status = 409;
    throw err;
  }
  const existingPhone = await userModel.findByPhone(normalizedPhone);
  if (existingPhone) {
    const err = new Error("Phone already in use");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await userModel.create({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    phone: normalizedPhone,
    role: "USER",
    profile: {
      create: {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        gender: normalizedGender,
        birthDate,
      },
    },
    wallet: { create: {} },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      adminPermissions: effectiveAdminPermissions(user.role, user.adminPermissions),
      isDisabled: Boolean(user.isDisabled),
    },
    token: signToken({ userId: user.id, role: user.role }),
  };
}

export async function checkUsernameAvailability(username) {
  const normalizedUsername = username.trim();
  if (!USERNAME_REGEX.test(normalizedUsername)) {
    const err = new Error("Username must be 3-20 characters with no spaces");
    err.status = 400;
    throw err;
  }

  const existing = await userModel.findByUsernameInsensitive(normalizedUsername);
  return { available: !existing };
}

export async function checkEmailAvailability(email) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    const err = new Error("Email must end with .com");
    err.status = 400;
    throw err;
  }

  const existing = await userModel.findByEmail(normalizedEmail);
  return { available: !existing };
}

export async function loginUser(payload) {
  const user = await userModel.findByEmail(payload.email.trim().toLowerCase());
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!valid) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      adminPermissions: effectiveAdminPermissions(user.role, user.adminPermissions),
      isDisabled: Boolean(user.isDisabled),
    },
    token: signToken({ userId: user.id, role: user.role }),
  };
}

export async function getCurrentUser(userId) {
  if (!userId || typeof userId !== "string") {
    const err = new Error("Invalid token");
    err.status = 401;
    throw err;
  }
  const user = await userModel.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    adminPermissions: effectiveAdminPermissions(user.role, user.adminPermissions),
    isDisabled: Boolean(user.isDisabled),
    profile: {
      avatarUrl: user.profile?.avatarUrl || null,
    },
  };
}

export async function requestPasswordResetCode(payload) {
  const email = String(payload.email || "").trim().toLowerCase();
  if (!email) {
    const err = new Error("Email is required");
    err.status = 400;
    throw err;
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error("No account is associated with this email");
    err.status = 404;
    throw err;
  }

  const latest = await passwordResetModel.getLatestActiveForUser(user.id);
  const now = new Date();
  const minIntervalMs = env.passwordResetMinRequestIntervalSeconds * 1000;
  if (latest?.createdAt && now.getTime() - new Date(latest.createdAt).getTime() < minIntervalMs) {
    const err = new Error("Please wait before requesting another code");
    err.status = 429;
    throw err;
  }

  await passwordResetModel.consumeAllForUser(user.id);

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.passwordResetCodeTtlMinutes * 60 * 1000);

  await passwordResetModel.create({
    userId: user.id,
    codeHash,
    expiresAt,
  });

  await sendPasswordResetCodeEmail({
    toEmail: email,
    code,
  });

  return {
    success: true,
    message: "Verification code sent",
  };
}

export async function verifyPasswordResetCode(payload) {
  const email = String(payload.email || "").trim().toLowerCase();
  const code = String(payload.code || "").trim();
  if (!email || !code) {
    const err = new Error("Email and code are required");
    err.status = 400;
    throw err;
  }
  if (!RESET_CODE_REGEX.test(code)) {
    const err = new Error("Invalid verification code format");
    err.status = 400;
    throw err;
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error("Invalid or expired verification code");
    err.status = 400;
    throw err;
  }

  const resetRequest = await passwordResetModel.getLatestActiveForUser(user.id);
  const now = Date.now();
  if (
    !resetRequest ||
    resetRequest.consumedAt ||
    resetRequest.verifiedAt ||
    new Date(resetRequest.expiresAt).getTime() < now
  ) {
    const err = new Error("Invalid or expired verification code");
    err.status = 400;
    throw err;
  }

  if ((resetRequest.attempts || 0) >= env.passwordResetMaxAttempts) {
    await passwordResetModel.consumeById(resetRequest.id);
    const err = new Error("Too many invalid attempts. Request a new code.");
    err.status = 429;
    throw err;
  }

  const isValidCode = await bcrypt.compare(code, resetRequest.codeHash);
  if (!isValidCode) {
    const updated = await passwordResetModel.incrementAttempts(resetRequest.id);
    if ((updated.attempts || 0) >= env.passwordResetMaxAttempts) {
      await passwordResetModel.consumeById(resetRequest.id);
    }
    const err = new Error("Invalid verification code");
    err.status = 400;
    throw err;
  }

  await passwordResetModel.markVerified(resetRequest.id);
  return {
    success: true,
    verificationId: resetRequest.id,
  };
}

export async function resetPasswordWithVerification(payload) {
  const verificationId = String(payload.verificationId || "").trim();
  const password = String(payload.password || "");
  const confirmPassword = String(payload.confirmPassword || "");

  if (!verificationId || !password || !confirmPassword) {
    const err = new Error("verificationId, password and confirmPassword are required");
    err.status = 400;
    throw err;
  }
  if (password.length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.status = 400;
    throw err;
  }
  if (password !== confirmPassword) {
    const err = new Error("Passwords do not match");
    err.status = 400;
    throw err;
  }

  const resetRequest = await passwordResetModel.getById(verificationId);
  if (!resetRequest || resetRequest.consumedAt || !resetRequest.verifiedAt) {
    const err = new Error("Invalid reset session");
    err.status = 400;
    throw err;
  }

  const now = Date.now();
  const expiresAtMs = new Date(resetRequest.expiresAt).getTime();
  const verifiedAtMs = new Date(resetRequest.verifiedAt).getTime();
  const verifiedWindowMs = env.passwordResetCodeTtlMinutes * 60 * 1000;
  const verifySessionExpired = now > verifiedAtMs + verifiedWindowMs;
  if (now > expiresAtMs || verifySessionExpired) {
    await passwordResetModel.consumeById(resetRequest.id);
    const err = new Error("Reset session expired. Please start again.");
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await userModel.updatePasswordHash(resetRequest.userId, passwordHash);
  await passwordResetModel.consumeAllForUser(resetRequest.userId);

  return {
    success: true,
  };
}
