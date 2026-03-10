import { orderModel } from "../models/order.model.js";
import { AppError } from "../utils/app-error.js";
import { hasAdminPermission } from "../utils/admin-permissions.js";

export async function placeOrder(buyerId, payload) {
  return orderModel.createWithWallets({
    buyerId,
    productId: payload.productId,
    selectedOption: payload.selectedOption,
    quantity: payload.quantity,
    offerId: payload.offerId,
    fullName: payload.fullName,
    phone: payload.phone,
    address: payload.address ?? "",
    wilayaId: payload.wilayaId,
    municipality: payload.municipality,
    deliveryMethod: payload.deliveryMethod,
  });
}

export function getOrdersForUser(userId, role, adminPermissions = []) {
  if (role === "ADMIN") {
    return hasAdminPermission(adminPermissions, "orders")
      ? orderModel.listAll()
      : orderModel.listByUser(userId);
  }
  return orderModel.listByUser(userId);
}

export async function changeOrderStatus(orderId, status, actor) {
  const order = await orderModel.getById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const currentStatus = order.status;
  const canCancelBeforeShipping = ["PENDING", "CONFIRMED", "PROCESSING"].includes(currentStatus);
  if (status === "CANCELED" && !canCancelBeforeShipping) {
    throw new AppError("Order can only be canceled before shipping", 400);
  }
  if (status === "DELIVERED" && currentStatus !== "SHIPPED") {
    throw new AppError("Order can only be marked delivered after shipping", 400);
  }

  const isAdmin = actor.role === "ADMIN";
  const canUseAdminPrivileges = isAdmin && hasAdminPermission(actor.adminPermissions || [], "orders");
  const isSeller = order.sellerId === actor.userId;
  const isBuyer = order.buyerId === actor.userId;

  if (!canUseAdminPrivileges && !isSeller && !isBuyer) {
    throw new AppError("Forbidden", 403);
  }

  if (isBuyer && !["CANCELED", "DELIVERED"].includes(status)) {
    throw new AppError("Buyers can only cancel or confirm delivery", 403);
  }

  if (isSeller && !canUseAdminPrivileges && !["PROCESSING", "SHIPPED"].includes(status)) {
    throw new AppError("Sellers can only set processing or shipped", 403);
  }

  return orderModel.setStatusWithSettlement(orderId, status);
}

export async function createOrderReview(orderId, buyerId, payload) {
  const order = await orderModel.getById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  if (order.buyerId !== buyerId) {
    throw new AppError("Only the buyer can review this order", 403);
  }
  if (order.status !== "DELIVERED") {
    throw new AppError("Order must be delivered before review", 400);
  }
  if (order.review) {
    throw new AppError("Order already reviewed", 409);
  }

  const review = await orderModel.createReview({
    orderId,
    stars: payload.stars,
    comment: payload.comment,
  });

  const stats = await orderModel.getSellerRatingStats(order.sellerId);
  const avg = Number(stats?._avg?.stars || 0);
  await orderModel.updateSellerRating(order.sellerId, avg);

  return review;
}
