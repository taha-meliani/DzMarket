import { verifyToken } from "../utils/jwt.js";
import { userModel } from "../models/user.model.js";
import { hasAdminPermission, hasAnyAdminPermission, normalizeAdminPermissions } from "../utils/admin-permissions.js";

function effectiveAdminPermissions(role, permissions) {
  if (role !== "ADMIN") return [];
  return normalizeAdminPermissions(permissions);
}

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyToken(token);
    const normalizedUserId = decoded?.userId || decoded?.id || decoded?.sub;
    if (!normalizedUserId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    const currentUser = await userModel.findById(normalizedUserId);
    if (!currentUser) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = {
      ...decoded,
      userId: normalizedUserId,
      role: currentUser.role,
      adminPermissions: effectiveAdminPermissions(currentUser.role, currentUser.adminPermissions),
    };
    return next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

export async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const normalizedUserId = decoded?.userId || decoded?.id || decoded?.sub;
    if (normalizedUserId) {
      const currentUser = await userModel.findById(normalizedUserId);
      if (!currentUser) return next();
      req.user = {
        ...decoded,
        userId: normalizedUserId,
        role: currentUser.role,
        adminPermissions: effectiveAdminPermissions(currentUser.role, currentUser.adminPermissions),
      };
    }
    return next();
  } catch {
    return next();
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

export function authorizeAdminPermission(permission) {
  return (req, res, next) => {
    if (
      !req.user ||
      req.user.role !== "ADMIN" ||
      !hasAdminPermission(req.user.adminPermissions || [], permission)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

export function authorizeAnyAdminPermission(...permissions) {
  return (req, res, next) => {
    if (
      !req.user ||
      req.user.role !== "ADMIN" ||
      !hasAnyAdminPermission(req.user.adminPermissions || [], permissions)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}
