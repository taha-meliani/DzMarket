import { Router } from "express";
import { z } from "zod";
import {
  addFavoriteController,
  listFavoritesController,
  removeFavoriteController,
} from "../controllers/favorite.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const addSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

const removeSchema = z.object({
  body: z.object({}),
  params: z.object({
    productId: z.string().min(1),
  }),
  query: z.object({}),
});

router.get("/", authenticate, listFavoritesController);
router.post("/", authenticate, validate(addSchema), addFavoriteController);
router.delete("/:productId", authenticate, validate(removeSchema), removeFavoriteController);

export default router;

