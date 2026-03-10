import { Router } from "express";
import { z } from "zod";
import { createOfferController, getMyAcceptedOfferController, respondOfferController } from "../controllers/offer.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireActiveAccount } from "../middlewares/account-state.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const createOfferSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    selectedOption: z.string().min(1),
    quantity: z.number().int().positive(),
    offeredPrice: z.number().positive(),
  }),
  params: z.object({}),
  query: z.object({}),
});

const respondOfferSchema = z.object({
  body: z.object({
    action: z.enum(["ACCEPT", "REJECT", "COUNTER"]),
    counterPrice: z.number().positive().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

const myAcceptedSchema = z.object({
  body: z.object({}),
  params: z.object({ productId: z.string().min(1) }),
  query: z.object({
    selectedOption: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
  }),
});

router.post("/", authenticate, requireActiveAccount, validate(createOfferSchema), createOfferController);
router.patch("/:id/respond", authenticate, requireActiveAccount, validate(respondOfferSchema), respondOfferController);
router.get("/product/:productId/my", authenticate, validate(myAcceptedSchema), getMyAcceptedOfferController);

export default router;
