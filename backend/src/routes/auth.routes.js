import { Router } from "express";
import { z } from "zod";
import {
  checkEmail,
  checkUsername,
  login,
  me,
  register,
  requestPasswordReset,
  resetPassword,
  verifyPasswordReset,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const registerSchema = z.object({
  body: z.object({
    username: z.string().regex(/^\S{3,20}$/),
    email: z.string().email().regex(/^[^\s@]+@[^\s@]+\.com$/i),
    password: z.string().min(8),
    phone: z.string().regex(/^(05|06|07)\d{8}$/),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    gender: z.enum(["male", "female"]),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const checkUsernameSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    username: z.string().regex(/^\S{3,20}$/),
  }),
});

const checkEmailSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    email: z.string().email().regex(/^[^\s@]+@[^\s@]+\.com$/i),
  }),
});

const requestPasswordResetSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const verifyPasswordResetSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().regex(/^\d{6}$/),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const resetPasswordSchema = z.object({
  body: z.object({
    verificationId: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, me);
router.get("/check-username", validate(checkUsernameSchema), checkUsername);
router.get("/check-email", validate(checkEmailSchema), checkEmail);
router.post("/forgot-password/request", validate(requestPasswordResetSchema), requestPasswordReset);
router.post("/forgot-password/verify", validate(verifyPasswordResetSchema), verifyPasswordReset);
router.post("/forgot-password/reset", validate(resetPasswordSchema), resetPassword);

export default router;
