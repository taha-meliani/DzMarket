import { userModel } from "../models/user.model.js";

const DISABLED_MESSAGE = "Account is disabled. Contact support for details.";

export async function requireActiveAccount(req, res, next) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role === "ADMIN") {
      return next();
    }
    const currentUser = await userModel.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (currentUser.isDisabled) {
      return res.status(403).json({ message: DISABLED_MESSAGE, code: "ACCOUNT_DISABLED" });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

