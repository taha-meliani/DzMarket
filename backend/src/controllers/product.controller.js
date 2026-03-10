import {
  createProduct,
  deleteProduct,
  getProductById,
  listCatalog,
  listProducts,
  updateProduct,
} from "../services/product.service.js";

export async function createProductController(req, res, next) {
  try {
    const product = await createProduct(req.user.userId, req.validated.body);
    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
}

export async function listProductsController(req, res, next) {
  try {
    const data = await listProducts({ sellerId: req.query.sellerId }, req.user?.userId, req.user?.role);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function getProductController(req, res, next) {
  try {
    const product = await getProductById(req.validated.params.id, req.user?.userId, req.user?.role);
    return res.json(product);
  } catch (error) {
    return next(error);
  }
}

export async function listCatalogController(req, res, next) {
  try {
    const catalog = await listCatalog();
    return res.json(catalog);
  } catch (error) {
    return next(error);
  }
}

export async function updateProductController(req, res, next) {
  try {
    const updated = await updateProduct(
      req.validated.params.id,
      req.validated.body,
      req.user.userId,
      req.user.role,
      req.user.adminPermissions || [],
    );
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

export async function deleteProductController(req, res, next) {
  try {
    await deleteProduct(req.validated.params.id, req.user.userId, req.user.role, req.user.adminPermissions || []);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
