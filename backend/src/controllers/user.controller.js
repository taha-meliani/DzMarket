import {
  createAdminByAdmin,
  followUser,
  getAdminDashboard,
  deleteMyAccount,
  deleteUserByAdmin,
  getMe,
  getUserPublicProfile,
  listIdentityRequests,
  listFollowers,
  listFollowing,
  listUsers,
  removeAdminByAdmin,
  reviewIdentityRequest,
  setUserDisabledByAdmin,
  submitMyIdentityRequest,
  unfollowUser,
  updateAdminPermissionsByAdmin,
  updateMe,
  verifyMyPassword,
} from "../services/user.service.js";

export async function getMyProfile(req, res, next) {
  try {
    const user = await getMe(req.user.userId);
    return res.json(user);
  } catch (error) {
    return next(error);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const updated = await updateMe(req.user.userId, req.validated.body, req.user.role);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

export async function listUsersController(req, res, next) {
  try {
    const users = await listUsers(req.user.role, req.user.adminPermissions || []);
    return res.json(users);
  } catch (error) {
    return next(error);
  }
}

export async function adminDashboardController(req, res, next) {
  try {
    const stats = await getAdminDashboard(req.user.role);
    return res.json(stats);
  } catch (error) {
    return next(error);
  }
}

export async function getUserProfileController(req, res, next) {
  try {
    const profile = await getUserPublicProfile(req.validated.params.id, req.user?.userId);
    return res.json(profile);
  } catch (error) {
    return next(error);
  }
}

export async function followUserController(req, res, next) {
  try {
    const profile = await followUser(req.user.userId, req.validated.params.id);
    return res.json(profile);
  } catch (error) {
    return next(error);
  }
}

export async function unfollowUserController(req, res, next) {
  try {
    const profile = await unfollowUser(req.user.userId, req.validated.params.id);
    return res.json(profile);
  } catch (error) {
    return next(error);
  }
}

export async function listFollowersController(req, res, next) {
  try {
    const rows = await listFollowers(req.user.userId, req.validated.params.id);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

export async function listFollowingController(req, res, next) {
  try {
    const rows = await listFollowing(req.user.userId, req.validated.params.id);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

export async function setUserDisabledController(req, res, next) {
  try {
    const result = await setUserDisabledByAdmin(
      req.user.role,
      req.user.adminPermissions || [],
      req.validated.params.id,
      req.validated.body.isDisabled,
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteMyAccountController(req, res, next) {
  try {
    const result = await deleteMyAccount(
      req.user.userId,
      req.validated.body.password,
      req.validated.body.confirmPassword,
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteUserByAdminController(req, res, next) {
  try {
    const result = await deleteUserByAdmin(
      req.user.userId,
      req.user.role,
      req.user.adminPermissions || [],
      req.validated.params.id,
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function verifyMyPasswordController(req, res, next) {
  try {
    const result = await verifyMyPassword(req.user.userId, req.validated.body.password);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function submitIdentityRequestController(req, res, next) {
  try {
    const result = await submitMyIdentityRequest(req.user.userId, req.validated.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function listIdentityRequestsController(req, res, next) {
  try {
    const rows = await listIdentityRequests(req.user.role, req.user.adminPermissions || []);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

export async function reviewIdentityRequestController(req, res, next) {
  try {
    const result = await reviewIdentityRequest(
      req.user.role,
      req.user.adminPermissions || [],
      req.user.userId,
      req.validated.params.id,
      req.validated.body.action,
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function createAdminController(req, res, next) {
  try {
    const row = await createAdminByAdmin(
      req.user.role,
      req.user.adminPermissions || [],
      req.validated.body.userId,
      req.validated.body.permissions,
    );
    return res.status(201).json(row);
  } catch (error) {
    return next(error);
  }
}

export async function updateAdminPermissionsController(req, res, next) {
  try {
    const row = await updateAdminPermissionsByAdmin(
      req.user.role,
      req.user.adminPermissions || [],
      req.validated.params.id,
      req.validated.body.permissions,
    );
    return res.json(row);
  } catch (error) {
    return next(error);
  }
}

export async function removeAdminController(req, res, next) {
  try {
    const row = await removeAdminByAdmin(req.user.role, req.user.adminPermissions || [], req.validated.params.id);
    return res.json(row);
  } catch (error) {
    return next(error);
  }
}
