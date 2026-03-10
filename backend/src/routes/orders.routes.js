import { Router } from "express";
import { z } from "zod";
import {
  createOrderReviewController,
  listOrdersController,
  placeOrderController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireActiveAccount } from "../middlewares/account-state.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const createOrderSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    selectedOption: z.string().min(1),
    quantity: z.number().int().positive(),
    offerId: z.string().min(1).optional(),
    fullName: z.string().min(2),
    phone: z.string().min(5),
    address: z.string().optional(),
    wilayaId: z.number().int(),
    municipality: z.string().min(1),
    deliveryMethod: z.enum(["HOME", "PICKUP_POINT"]),
  }),
  params: z.object({}),
  query: z.object({}),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELED"]),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

const reviewSchema = z.object({
  body: z.object({
    stars: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

router.post("/", authenticate, requireActiveAccount, validate(createOrderSchema), placeOrderController);
router.get("/", authenticate, listOrdersController);
router.patch("/:id/status", authenticate, validate(updateStatusSchema), updateOrderStatusController);
router.post("/:id/review", authenticate, validate(reviewSchema), createOrderReviewController);

export default router;
