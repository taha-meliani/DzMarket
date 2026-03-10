import { addFavorite, listFavorites, removeFavorite } from "../services/favorite.service.js";

export async function listFavoritesController(req, res, next) {
  try {
    const favorites = await listFavorites(req.user.userId);
    return res.json(favorites);
  } catch (error) {
    return next(error);
  }
}

export async function addFavoriteController(req, res, next) {
  try {
    const favorite = await addFavorite(req.user.userId, req.validated.body.productId);
    return res.status(201).json(favorite);
  } catch (error) {
    return next(error);
  }
}

export async function removeFavoriteController(req, res, next) {
  try {
    await removeFavorite(req.user.userId, req.validated.params.productId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

