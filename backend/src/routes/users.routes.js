import { Router } from "express";
import { z } from "zod";
import {
  adminDashboardController,
  createAdminController,
  deleteMyAccountController,
  deleteUserByAdminController,
  followUserController,
  getUserProfileController,
  getMyProfile,
  listFollowersController,
  listIdentityRequestsController,
  listFollowingController,
  listUsersController,
  reviewIdentityRequestController,
  removeAdminController,
  setUserDisabledController,
  submitIdentityRequestController,
  unfollowUserController,
  updateAdminPermissionsController,
  updateMyProfile,
  verifyMyPasswordController,
} from "../controllers/user.controller.js";
import {
  authenticate,
  authorize,
  authorizeAdminPermission,
  authorizeAnyAdminPermission,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().min(1).max(6_000_000).optional(),
    bio: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    gender: z.enum(["male", "female"]).optional(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    currentPassword: z.string().min(6).optional(),
    newPassword: z.string().min(8).optional(),
    wilayaId: z.number().int().optional(),
    municipality: z.string().optional(),
    showLocation: z.boolean().optional(),
    verified: z.boolean().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

const userIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).optional(),
});

const deleteMyAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

const setUserDisabledSchema = z.object({
  body: z.object({
    isDisabled: z.boolean(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}),
});

const verifyPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

const submitIdentitySchema = z.object({
  body: z.object({
    documentImage: z.string().min(1).max(6_000_000),
  }),
  params: z.object({}),
  query: z.object({}),
});

const reviewIdentitySchema = z.object({
  body: z.object({
    action: z.enum(["APPROVE", "REJECT"]),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}),
});

const adminPermissionsEnum = z.enum([
  "users",
  "products",
  "orders",
  "payments",
  "verification",
  "support",
  "admins",
]);

const createAdminSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    permissions: z.array(adminPermissionsEnum).min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

const updateAdminPermissionsSchema = z.object({
  body: z.object({
    permissions: z.array(adminPermissionsEnum),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}),
});

router.get("/me", authenticate, getMyProfile);
router.patch("/me", authenticate, validate(updateProfileSchema), updateMyProfile);
router.post("/me/identity-request", authenticate, validate(submitIdentitySchema), submitIdentityRequestController);
router.post("/me/verify-password", authenticate, validate(verifyPasswordSchema), verifyMyPasswordController);
router.post("/me/delete", authenticate, validate(deleteMyAccountSchema), deleteMyAccountController);
router.get("/admin/dashboard", authenticate, authorize("ADMIN"), adminDashboardController);
router.get(
  "/admin/identity-requests",
  authenticate,
  authorizeAdminPermission("verification"),
  listIdentityRequestsController,
);
router.patch(
  "/admin/identity-requests/:id",
  authenticate,
  authorizeAdminPermission("verification"),
  validate(reviewIdentitySchema),
  reviewIdentityRequestController,
);
router.post(
  "/admins",
  authenticate,
  authorizeAdminPermission("admins"),
  validate(createAdminSchema),
  createAdminController,
);
router.patch(
  "/admins/:id/permissions",
  authenticate,
  authorizeAdminPermission("admins"),
  validate(updateAdminPermissionsSchema),
  updateAdminPermissionsController,
);
router.delete(
  "/admins/:id",
  authenticate,
  authorizeAdminPermission("admins"),
  validate(userIdParamSchema),
  removeAdminController,
);
router.get("/:id/followers", authenticate, validate(userIdParamSchema), listFollowersController);
router.get("/:id/following", authenticate, validate(userIdParamSchema), listFollowingController);
router.post("/:id/follow", authenticate, validate(userIdParamSchema), followUserController);
router.delete("/:id/follow", authenticate, validate(userIdParamSchema), unfollowUserController);
router.get("/:id", authenticate, validate(userIdParamSchema), getUserProfileController);
router.patch(
  "/:id/status",
  authenticate,
  authorizeAdminPermission("users"),
  validate(setUserDisabledSchema),
  setUserDisabledController,
);
router.delete(
  "/:id",
  authenticate,
  authorizeAdminPermission("users"),
  validate(userIdParamSchema),
  deleteUserByAdminController,
);
router.get("/", authenticate, authorizeAnyAdminPermission("users", "admins"), listUsersController);

export default router;
