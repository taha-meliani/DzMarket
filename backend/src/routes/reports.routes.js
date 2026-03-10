import { Router } from "express";
import { z } from "zod";
import {
  createProductReportController,
  createUserReportController,
  deleteAllProductReportsByProductIdController,
  deleteAllUserReportsByUserIdController,
  deleteProductReportController,
  deleteUserReportController,
  listProductReportsController,
  listUserReportsController,
} from "../controllers/report.controller.js";
import { authenticate, authorizeAdminPermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const createUserReportSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    type: z.enum(["fake", "fraud", "abuse", "spam"]),
  }),
  params: z.object({}),
  query: z.object({}),
});

const createProductReportSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    type: z.enum(["fraud", "counterfeit", "wrong_info", "abuse", "other"]),
  }),
  params: z.object({}),
  query: z.object({}),
});

const emptySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({}),
});

const userReportIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    reportId: z.string().min(1),
  }),
  query: z.object({}),
});

const userReportsByUserIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    userId: z.string().min(1),
  }),
  query: z.object({}),
});

const productReportIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    reportId: z.string().min(1),
  }),
  query: z.object({}),
});

const productReportsByProductIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    productId: z.string().min(1),
  }),
  query: z.object({}),
});

router.post("/users", authenticate, validate(createUserReportSchema), createUserReportController);
router.post("/products", authenticate, validate(createProductReportSchema), createProductReportController);
router.get(
  "/users",
  authenticate,
  authorizeAdminPermission("users"),
  validate(emptySchema),
  listUserReportsController,
);
router.delete(
  "/users/:reportId",
  authenticate,
  authorizeAdminPermission("users"),
  validate(userReportIdSchema),
  deleteUserReportController,
);
router.delete(
  "/users/by-user/:userId",
  authenticate,
  authorizeAdminPermission("users"),
  validate(userReportsByUserIdSchema),
  deleteAllUserReportsByUserIdController,
);
router.get(
  "/products",
  authenticate,
  authorizeAdminPermission("products"),
  validate(emptySchema),
  listProductReportsController,
);
router.delete(
  "/products/:reportId",
  authenticate,
  authorizeAdminPermission("products"),
  validate(productReportIdSchema),
  deleteProductReportController,
);
router.delete(
  "/products/by-product/:productId",
  authenticate,
  authorizeAdminPermission("products"),
  validate(productReportsByProductIdSchema),
  deleteAllProductReportsByProductIdController,
);

export default router;
