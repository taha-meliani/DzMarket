import { Router } from "express";
import { z } from "zod";
import {
  createProductController,
  deleteProductController,
  getProductController,
  listCatalogController,
  listProductsController,
  updateProductController,
} from "../controllers/product.controller.js";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.middleware.js";
import { requireActiveAccount } from "../middlewares/account-state.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const productOptionBody = z.object({
  name: z.string().min(1).max(120),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
});

const productBody = z.object({
  title: z.string().min(2),
  description: z.string().min(3),
  condition: z.enum(["new", "used"]),
  packageSize: z.enum(["small", "medium", "large"]),
  freeShipping: z.boolean().optional(),
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1),
  images: z.array(z.string().min(1).max(6_000_000)).max(10).optional(),
  options: z.array(productOptionBody).min(1).max(20),
});

const createSchema = z.object({
  body: productBody,
  params: z.object({}),
  query: z.object({}),
});

const updateSchema = z.object({
  body: productBody.partial(),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

const idSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

router.get("/", optionalAuthenticate, listProductsController);
router.get("/catalog", listCatalogController);
router.get("/:id", optionalAuthenticate, validate(idSchema), getProductController);
router.post("/", authenticate, requireActiveAccount, validate(createSchema), createProductController);
router.patch("/:id", authenticate, requireActiveAccount, validate(updateSchema), updateProductController);
router.delete("/:id", authenticate, requireActiveAccount, validate(idSchema), deleteProductController);

export default router;
