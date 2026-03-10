import { userModel } from "../models/user.model.js";
import { productModel } from "../models/product.model.js";
import { orderModel } from "../models/order.model.js";
import { identityModel } from "../models/identity.model.js";
import bcrypt from "bcryptjs";
import { hasAdminPermission, normalizeAdminPermissions } from "../utils/admin-permissions.js";

function effectiveAdminPermissions(role, permissions) {
  if (role !== "ADMIN") return [];
  return normalizeAdminPermissions(permissions);
}

export async function getMe(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  const pendingIdentityRequest = await identityModel.findPendingByUserId(userId);
  const reviews = await orderModel.listReviewsForSeller(userId);
  const profile = {
    ...(user.profile || {}),
    identityStatus: user.profile?.verified ? "verified" : pendingIdentityRequest ? "pending" : "unverified",
    idFrontImage: pendingIdentityRequest?.documentImage || "",
  };
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    adminPermissions: effectiveAdminPermissions(user.role, user.adminPermissions),
    isDisabled: Boolean(user.isDisabled),
    phone: user.phone,
    createdAt: user.createdAt,
    profile,
    wallet: user.wallet,
    reviews: reviews.map((review) => ({
      id: review.id,
      stars: review.stars,
      comment: review.comment,
      date: review.date,
      buyer: {
        id: review.order.buyer.id,
        username: review.order.buyer.username,
        avatarUrl: review.order.buyer.profile?.avatarUrl || "",
      },
    })),
  };
}

export async function submitMyIdentityRequest(userId, payload) {
  const user = await userModel.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  if (user.profile?.verified) {
    const err = new Error("Identity already verified");
    err.status = 400;
    throw err;
  }
  await identityModel.upsertPendingRequest({
    userId,
    documentImage: payload.documentImage,
  });
  return { success: true, status: "pending" };
}

export async function listIdentityRequests(role, adminPermissions = []) {
  if (role !== "ADMIN" || !hasAdminPermission(effectiveAdminPermissions(role, adminPermissions), "verification")) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const rows = await identityModel.listPendingRequests();
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    user: row.username || "",
    requestDate: row.createdAt,
    documentImage: row.documentImage || "",
    status: "pending",
    sender: {
      firstName: row.firstName || "",
      lastName: row.lastName || "",
      gender: row.gender || "",
      birthDate: row.birthDate ? new Date(row.birthDate).toISOString().slice(0, 10) : "",
    },
  }));
}

export async function reviewIdentityRequest(role, adminPermissions, reviewerUserId, requestId, action) {
  if (role !== "ADMIN" || !hasAdminPermission(effectiveAdminPermissions(role, adminPermissions), "verification")) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const request = await identityModel.findById(requestId);
  if (!request) {
    const err = new Error("Identity request not found");
    err.status = 404;
    throw err;
  }
  await userModel.upsertProfile(request.userId, {
    verified: action === "APPROVE",
  });
  await identityModel.deleteById(requestId);
  return { success: true };
}

export async function updateMe(userId, payload, role) {
  await userModel.ensureProfile(userId);
  const currentUser = await userModel.findById(userId);
  const isIdentityVerified = Boolean(currentUser?.profile?.verified);

  const userUpdates = {};

  if (payload.username) {
    const requestedUsername = payload.username.trim();
    if (requestedUsername && requestedUsername !== currentUser.username) {
      const existingUsername = await userModel.findByUsernameInsensitive(requestedUsername);
      if (existingUsername && existingUsername.id !== userId) {
        const err = new Error("Username already in use");
        err.status = 409;
        throw err;
      }
      userUpdates.username = requestedUsername;
    }
  }

  if (payload.email) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (normalizedEmail && normalizedEmail !== currentUser.email.toLowerCase()) {
      const existingEmail = await userModel.findByEmail(normalizedEmail);
      if (existingEmail && existingEmail.id !== userId) {
        const err = new Error("Email already in use");
        err.status = 409;
        throw err;
      }
      userUpdates.email = normalizedEmail;
    }
  }

  if (payload.phone !== undefined) {
    const normalizedPhone = String(payload.phone || "").trim();
    if (normalizedPhone) {
      const existingPhone = await userModel.findByPhone(normalizedPhone);
      if (existingPhone && existingPhone.id !== userId) {
        const err = new Error("Phone already in use");
        err.status = 409;
        throw err;
      }
      userUpdates.phone = normalizedPhone;
    } else {
      userUpdates.phone = null;
    }
  }

  if (payload.newPassword !== undefined || payload.currentPassword !== undefined) {
    if (!payload.currentPassword || !payload.newPassword) {
      const err = new Error("Current and new password are required");
      err.status = 400;
      throw err;
    }
    const validPassword = await bcrypt.compare(payload.currentPassword, currentUser.passwordHash);
    if (!validPassword) {
      const err = new Error("Current password is incorrect");
      err.status = 401;
      throw err;
    }
    userUpdates.passwordHash = await bcrypt.hash(payload.newPassword, 10);
  }

  if (Object.keys(userUpdates).length > 0) {
    await userModel.update(userId, userUpdates);
  }

  const profileData = {
    avatarUrl: payload.avatarUrl,
    bio: payload.bio,
    firstName: isIdentityVerified ? undefined : payload.firstName,
    lastName: isIdentityVerified ? undefined : payload.lastName,
    gender: isIdentityVerified ? undefined : payload.gender,
    birthDate: isIdentityVerified ? undefined : payload.birthDate ? new Date(payload.birthDate) : undefined,
    wilayaId: payload.wilayaId,
    municipality: payload.municipality,
    showLocation: payload.showLocation,
  };

  if (role === "ADMIN" && payload.verified !== undefined) {
    profileData.verified = payload.verified;
  }

  const hasProfileChanges = Object.values(profileData).some((v) => v !== undefined);
  if (hasProfileChanges) {
    await userModel.upsertProfile(userId, profileData);
  }

  return getMe(userId);
}

export async function getUserPublicProfile(userId, requesterId) {
  const user = await userModel.findPublicById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  let isFollowing = false;
  if (requesterId && requesterId !== userId) {
    const relation = await userModel.findFollow(requesterId, userId);
    isFollowing = Boolean(relation);
  }
  const reviews = await orderModel.listReviewsForSeller(userId);

  return {
    ...user,
    isFollowing,
    reviews: reviews.map((review) => ({
      id: review.id,
      stars: review.stars,
      comment: review.comment,
      date: review.date,
      buyer: {
        id: review.order.buyer.id,
        username: review.order.buyer.username,
        avatarUrl: review.order.buyer.profile?.avatarUrl || "",
      },
    })),
  };
}

export async function followUser(requesterId, targetUserId) {
  if (requesterId === targetUserId) {
    const err = new Error("Cannot follow yourself");
    err.status = 400;
    throw err;
  }

  const target = await userModel.findPublicById(targetUserId);
  if (!target) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const existing = await userModel.findFollow(requesterId, targetUserId);
  if (!existing) {
    await userModel.follow(requesterId, targetUserId);
  }

  return getUserPublicProfile(targetUserId, requesterId);
}

export async function unfollowUser(requesterId, targetUserId) {
  if (requesterId === targetUserId) {
    const err = new Error("Cannot unfollow yourself");
    err.status = 400;
    throw err;
  }

  const existing = await userModel.findFollow(requesterId, targetUserId);
  if (existing) {
    await userModel.unfollow(requesterId, targetUserId);
  }

  return getUserPublicProfile(targetUserId, requesterId);
}

function assertCanViewFollowLists(requesterId, targetUserId) {
  if (requesterId !== targetUserId) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
}

export async function listFollowers(requesterId, targetUserId) {
  assertCanViewFollowLists(requesterId, targetUserId);
  const rows = await userModel.listFollowers(targetUserId);
  return rows.map((row) => ({
    id: row.follower.id,
    username: row.follower.username,
    avatarUrl: row.follower.profile?.avatarUrl || "",
  }));
}

export async function listFollowing(requesterId, targetUserId) {
  assertCanViewFollowLists(requesterId, targetUserId);
  const rows = await userModel.listFollowing(targetUserId);
  return rows.map((row) => ({
    id: row.following.id,
    username: row.following.username,
    avatarUrl: row.following.profile?.avatarUrl || "",
  }));
}

export async function listUsers(role, adminPermissions = []) {
  const permissions = effectiveAdminPermissions(role, adminPermissions);
  const canAccess = hasAdminPermission(permissions, "users") || hasAdminPermission(permissions, "admins");
  if (role !== "ADMIN" || !canAccess) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return userModel.list();
}

export async function createAdminByAdmin(requesterRole, requesterPermissions, targetUserId, permissions) {
  if (
    requesterRole !== "ADMIN" ||
    !hasAdminPermission(effectiveAdminPermissions(requesterRole, requesterPermissions), "admins")
  ) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const target = await userModel.findById(targetUserId);
  if (!target) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  const normalizedPermissions = normalizeAdminPermissions(permissions);
  if (!normalizedPermissions.length) {
    const err = new Error("At least one admin permission is required");
    err.status = 400;
    throw err;
  }
  const updated = await userModel.setAdminRole(targetUserId, normalizedPermissions);
  return updated;
}

export async function updateAdminPermissionsByAdmin(requesterRole, requesterPermissions, targetUserId, permissions) {
  if (
    requesterRole !== "ADMIN" ||
    !hasAdminPermission(effectiveAdminPermissions(requesterRole, requesterPermissions), "admins")
  ) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const target = await userModel.findById(targetUserId);
  if (!target) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  if (target.role !== "ADMIN") {
    const err = new Error("Target user is not admin");
    err.status = 400;
    throw err;
  }
  const normalizedPermissions = normalizeAdminPermissions(permissions);
  const updated = await userModel.updateAdminPermissions(targetUserId, normalizedPermissions);
  return updated;
}

export async function removeAdminByAdmin(requesterRole, requesterPermissions, targetUserId) {
  if (
    requesterRole !== "ADMIN" ||
    !hasAdminPermission(effectiveAdminPermissions(requesterRole, requesterPermissions), "admins")
  ) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const target = await userModel.findById(targetUserId);
  if (!target) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  if (target.role !== "ADMIN") {
    const err = new Error("Target user is not admin");
    err.status = 400;
    throw err;
  }
  const updated = await userModel.demoteAdminToUser(targetUserId);
  return updated;
}

export async function setUserDisabledByAdmin(requesterRole, requesterPermissions, targetUserId, isDisabled) {
  if (
    requesterRole !== "ADMIN" ||
    !hasAdminPermission(effectiveAdminPermissions(requesterRole, requesterPermissions), "users")
  ) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const target = await userModel.findById(targetUserId);
  if (!target) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  const updated = await userModel.setDisabled(targetUserId, Boolean(isDisabled));
  return {
    id: updated.id,
    isDisabled: Boolean(updated.isDisabled),
  };
}

export async function getAdminDashboard(role) {
  if (role !== "ADMIN") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const [users, products, orders, groupedRoles] = await Promise.all([
    userModel.list(),
    productModel.count(),
    orderModel.count(),
    userModel.countByRole(),
  ]);

  const totalAdmins = groupedRoles.find((x) => x.role === "ADMIN")?._count.role || 0;
  return {
    totalUsers: users.length,
    totalProducts: products,
    totalOrders: orders,
    totalAdmins,
  };
}

export async function verifyMyPassword(userId, password) {
  const currentUser = await userModel.findById(userId);
  if (!currentUser) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  const normalizedPassword = String(password || "");
  if (!normalizedPassword) {
    const err = new Error("Password is required");
    err.status = 400;
    throw err;
  }
  const validPassword = await bcrypt.compare(normalizedPassword, currentUser.passwordHash);
  if (!validPassword) {
    const err = new Error("Current password is incorrect");
    err.status = 401;
    throw err;
  }
  return { valid: true };
}

export async function deleteMyAccount(userId, password, confirmPassword) {
  const currentUser = await userModel.findById(userId);
  if (!currentUser) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const normalizedPassword = String(password || "");
  const normalizedConfirm = String(confirmPassword || "");
  if (!normalizedPassword || !normalizedConfirm) {
    const err = new Error("Password and confirmation are required");
    err.status = 400;
    throw err;
  }
  if (normalizedPassword !== normalizedConfirm) {
    const err = new Error("Passwords do not match");
    err.status = 400;
    throw err;
  }

  const validPassword = await bcrypt.compare(normalizedPassword, currentUser.passwordHash);
  if (!validPassword) {
    const err = new Error("Current password is incorrect");
    err.status = 401;
    throw err;
  }

  await userModel.deleteCompletely(userId);
  return { success: true };
}

export async function deleteUserByAdmin(requesterId, requesterRole, requesterPermissions, targetUserId) {
  if (
    requesterRole !== "ADMIN" ||
    !hasAdminPermission(effectiveAdminPermissions(requesterRole, requesterPermissions), "users")
  ) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  if (requesterId === targetUserId) {
    const err = new Error("Use account settings to delete your own account");
    err.status = 400;
    throw err;
  }

  const target = await userModel.findById(targetUserId);
  if (!target) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  await userModel.deleteCompletely(targetUserId);
  return { success: true };
}
