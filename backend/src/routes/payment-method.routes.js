import { Router } from "express";
import { z } from "zod";
import {
  deleteCcpController,
  deleteEdahabiaController,
  getPaymentMethodsController,
  upsertCcpController,
  upsertEdahabiaController,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const edahabiaSchema = z.object({
  body: z.object({
    cardNumberMasked: z.string().min(4),
    cvv: z.string().min(3).max(4),
    holderName: z.string().min(2),
    expiry: z.string().min(4),
  }),
  params: z.object({}),
  query: z.object({}),
});

const ccpSchema = z.object({
  body: z.object({
    accountNumber: z.string().min(5),
    securityKey: z.string().min(2),
  }),
  params: z.object({}),
  query: z.object({}),
});

router.get("/", authenticate, getPaymentMethodsController);
router.put("/edahabia", authenticate, validate(edahabiaSchema), upsertEdahabiaController);
router.put("/ccp", authenticate, validate(ccpSchema), upsertCcpController);
router.delete("/edahabia", authenticate, deleteEdahabiaController);
router.delete("/ccp", authenticate, deleteCcpController);

export default router;
