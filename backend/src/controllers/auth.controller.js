import {
  checkEmailAvailability,
  checkUsernameAvailability,
  getCurrentUser,
  loginUser,
  registerUser,
  requestPasswordResetCode,
  resetPasswordWithVerification,
  verifyPasswordResetCode,
} from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    const result = await registerUser(req.validated.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.validated.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.userId);
    return res.json(user);
  } catch (error) {
    return next(error);
  }
}

export async function checkUsername(req, res, next) {
  try {
    const result = await checkUsernameAvailability(req.validated.query.username);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function checkEmail(req, res, next) {
  try {
    const result = await checkEmailAvailability(req.validated.query.email);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    const result = await requestPasswordResetCode(req.validated.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function verifyPasswordReset(req, res, next) {
  try {
    const result = await verifyPasswordResetCode(req.validated.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await resetPasswordWithVerification(req.validated.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
