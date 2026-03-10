import { favoriteModel } from "../models/favorite.model.js";
import { productModel } from "../models/product.model.js";
import { AppError } from "../utils/app-error.js";

export async function addFavorite(userId, productId) {
  const product = await productModel.getById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  const existing = await favoriteModel.exists(userId, productId);
  if (existing) {
    throw new AppError("Product already in favorites", 409);
  }
  return favoriteModel.add(userId, productId);
}

export async function removeFavorite(userId, productId) {
  const existing = await favoriteModel.exists(userId, productId);
  if (!existing) {
    throw new AppError("Favorite not found", 404);
  }
  return favoriteModel.remove(userId, productId);
}

export function listFavorites(userId) {
  return favoriteModel.listForUser(userId);
}
