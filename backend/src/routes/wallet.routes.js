import { Router } from "express";
import { z } from "zod";
import {
  addFundsController,
  getWalletController,
  listWithdrawalRequestsController,
  markWithdrawalPaidController,
  withdrawFundsController,
} from "../controllers/wallet.controller.js";
import { authenticate, authorizeAdminPermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const amountSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
  }),
  params: z.object({}),
  query: z.object({}),
});

const adminWithdrawalIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}),
});

router.get("/", authenticate, getWalletController);
router.post("/add-funds", authenticate, validate(amountSchema), addFundsController);
router.post("/withdraw", authenticate, validate(amountSchema), withdrawFundsController);
router.get(
  "/admin/withdrawals",
  authenticate,
  authorizeAdminPermission("payments"),
  listWithdrawalRequestsController,
);
router.patch(
  "/admin/withdrawals/:id/paid",
  authenticate,
  authorizeAdminPermission("payments"),
  validate(adminWithdrawalIdSchema),
  markWithdrawalPaidController,
);

export default router;
