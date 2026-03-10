import {
  deleteCcp,
  deleteEdahabia,
  getPaymentMethods,
  upsertCcp,
  upsertEdahabia,
} from "../services/payment-method.service.js";

export async function getPaymentMethodsController(req, res, next) {
  try {
    const methods = await getPaymentMethods(req.user.userId);
    return res.json(methods);
  } catch (error) {
    return next(error);
  }
}

export async function upsertEdahabiaController(req, res, next) {
  try {
    const method = await upsertEdahabia(req.user.userId, req.validated.body);
    return res.json(method);
  } catch (error) {
    return next(error);
  }
}

export async function upsertCcpController(req, res, next) {
  try {
    const method = await upsertCcp(req.user.userId, req.validated.body);
    return res.json(method);
  } catch (error) {
    return next(error);
  }
}

export async function deleteEdahabiaController(req, res, next) {
  try {
    await deleteEdahabia(req.user.userId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function deleteCcpController(req, res, next) {
  try {
    await deleteCcp(req.user.userId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
