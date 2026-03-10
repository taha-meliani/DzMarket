import {
  changeOrderStatus,
  createOrderReview,
  getOrdersForUser,
  placeOrder,
} from "../services/order.service.js";

export async function placeOrderController(req, res, next) {
  try {
    const order = await placeOrder(req.user.userId, req.validated.body);
    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
}

export async function listOrdersController(req, res, next) {
  try {
    const data = await getOrdersForUser(req.user.userId, req.user.role, req.user.adminPermissions || []);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function updateOrderStatusController(req, res, next) {
  try {
    const updated = await changeOrderStatus(req.validated.params.id, req.validated.body.status, req.user);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

export async function createOrderReviewController(req, res, next) {
  try {
    const review = await createOrderReview(
      req.validated.params.id,
      req.user.userId,
      req.validated.body,
    );
    return res.status(201).json(review);
  } catch (error) {
    return next(error);
  }
}
