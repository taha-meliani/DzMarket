import { productModel } from "../models/product.model.js";
import { userModel } from "../models/user.model.js";
import { hasAdminPermission } from "../utils/admin-permissions.js";

const defaultCatalog = [
  { id: "electronics", name: "electronics", subcategories: ["phones", "computers", "accessories", "gaming"] },
  { id: "women", name: "women", subcategories: ["clothing", "shoes", "accessories", "bags"] },
  { id: "men", name: "men", subcategories: ["clothing", "shoes", "accessories"] },
  { id: "children", name: "children", subcategories: ["clothing", "shoes", "toys"] },
  { id: "home", name: "home", subcategories: ["furniture", "appliances", "decor"] },
  { id: "sports", name: "sports", subcategories: ["equipment", "clothing", "outdoor"] },
  { id: "books", name: "books", subcategories: ["textbooks", "fiction", "other"] },
];

export async function listCatalog() {
  const current = await productModel.listCategories();
  if (current.length > 0) {
    return current;
  }

  // Bootstrap a minimal catalog once in empty databases.
  for (const category of defaultCatalog) {
    for (const sub of category.subcategories) {
      // eslint-disable-next-line no-await-in-loop
      await productModel.ensureCategoryAndSubcategory(category.id, `${category.id}:${sub}`);
    }
  }
  return productModel.listCategories();
}

export async function createProduct(userId, payload) {
  const seller = await userModel.findById(userId);
  if (!seller) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  if (seller.isDisabled) {
    const err = new Error("Account is disabled. Contact support for details.");
    err.status = 403;
    throw err;
  }
  const subcategory = await productModel.ensureCategoryAndSubcategory(
    payload.categoryId,
    payload.subcategoryId,
  );

  const images = Array.isArray(payload.images)
    ? payload.images
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter(Boolean)
        .slice(0, 10)
    : [];

  const options = Array.isArray(payload.options)
    ? payload.options
        .map((option) => ({
          name: typeof option?.name === "string" ? option.name.trim() : "",
          price: Number(option?.price),
          quantity: Number(option?.quantity) || 0,
        }))
        .filter(
          (option) =>
            option.name &&
            Number.isFinite(option.price) &&
            option.price > 0 &&
            Number.isInteger(option.quantity) &&
            option.quantity > 0,
        )
        .slice(0, 20)
    : [];
  if (options.length === 0) {
    const err = new Error("At least one valid option is required");
    err.status = 400;
    throw err;
  }
  const totalQuantity = options.reduce((sum, option) => sum + option.quantity, 0);
  const defaultPrice = options[0]?.price || 0;

  return productModel.create({
    sellerId: userId,
    title: payload.title,
    description: payload.description,
    condition: payload.condition || "new",
    packageSize: payload.packageSize || "small",
    freeShipping: Boolean(payload.freeShipping),
    price: defaultPrice,
    quantity: totalQuantity,
    categoryId: payload.categoryId,
    subcategoryId: subcategory.id,
    images: images.length
      ? {
          create: images.map((url, index) => ({
            url,
            sortOrder: index,
          })),
        }
      : undefined,
    options: options.length
      ? {
          create: options.map((option, index) => ({
            name: option.name,
            price: option.price,
            quantity: option.quantity,
            sortOrder: index,
          })),
        }
      : undefined,
  });
}

export function listProducts(filter = {}, requesterId, requesterRole) {
  if (filter.sellerId) {
    return productModel.listBySeller(filter.sellerId, requesterId, requesterRole);
  }
  return productModel.list();
}

export async function getProductById(id, requesterId, requesterRole) {
  const product = await productModel.getById(id, requesterId, requesterRole);
  if (!product) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  return product;
}

export async function updateProduct(id, payload, userId, userRole, adminPermissions = []) {
  const existing = await getProductById(id, userId, userRole);
  if (userRole === "ADMIN" && !hasAdminPermission(adminPermissions, "products") && existing.sellerId !== userId) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  if (userRole !== "ADMIN" && existing.sellerId !== userId) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  if (userRole !== "ADMIN") {
    const seller = await userModel.findById(userId);
    if (!seller) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    if (seller.isDisabled) {
      const err = new Error("Account is disabled. Contact support for details.");
      err.status = 403;
      throw err;
    }
  }
  const nextPayload = { ...payload };
  if (payload.categoryId && payload.subcategoryId) {
    const subcategory = await productModel.ensureCategoryAndSubcategory(
      payload.categoryId,
      payload.subcategoryId,
    );
    nextPayload.subcategoryId = subcategory.id;
  }
  if (payload.condition) {
    nextPayload.condition = payload.condition;
  }
  if (payload.packageSize) {
    nextPayload.packageSize = payload.packageSize;
  }
  if (typeof payload.freeShipping === "boolean") {
    nextPayload.freeShipping = payload.freeShipping;
  }
  if (Array.isArray(payload.images)) {
    const cleanedImages = payload.images
      .map((url) => (typeof url === "string" ? url.trim() : ""))
      .filter(Boolean)
      .slice(0, 10);
    nextPayload.images = {
      deleteMany: {},
      create: cleanedImages.map((url, index) => ({ url, sortOrder: index })),
    };
  }
  if (Array.isArray(payload.options)) {
    const cleanedOptions = payload.options
      .map((option) => ({
        name: typeof option?.name === "string" ? option.name.trim() : "",
        price: Number(option?.price),
        quantity: Number(option?.quantity) || 0,
      }))
      .filter(
        (option) =>
          option.name &&
          Number.isFinite(option.price) &&
          option.price > 0 &&
          Number.isInteger(option.quantity) &&
          option.quantity > 0,
      )
      .slice(0, 20);
    if (cleanedOptions.length === 0) {
      const err = new Error("At least one valid option is required");
      err.status = 400;
      throw err;
    }
    nextPayload.options = {
      deleteMany: {},
      create: cleanedOptions.map((option, index) => ({
        name: option.name,
        price: option.price,
        quantity: option.quantity,
        sortOrder: index,
      })),
    };
    nextPayload.quantity = cleanedOptions.reduce((sum, option) => sum + option.quantity, 0);
    nextPayload.price = cleanedOptions[0]?.price || existing.price;
  }
  return productModel.update(id, nextPayload);
}

export async function deleteProduct(id, userId, userRole, adminPermissions = []) {
  const existing = await getProductById(id, userId, userRole);
  if (userRole === "ADMIN" && !hasAdminPermission(adminPermissions, "products") && existing.sellerId !== userId) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  if (userRole !== "ADMIN" && existing.sellerId !== userId) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  if (userRole !== "ADMIN") {
    const seller = await userModel.findById(userId);
    if (!seller) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    if (seller.isDisabled) {
      const err = new Error("Account is disabled. Contact support for details.");
      err.status = 403;
      throw err;
    }
  }
  return productModel.remove(id);
}
