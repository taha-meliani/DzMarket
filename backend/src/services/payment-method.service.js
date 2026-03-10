import { paymentModel } from "../models/payment.model.js";

export function upsertEdahabia(userId, payload) {
  return paymentModel.upsertEdahabia(userId, payload);
}

export function upsertCcp(userId, payload) {
  return paymentModel.upsertCcp(userId, payload);
}

export function getPaymentMethods(userId) {
  return paymentModel.getMethods(userId);
}

export async function deleteEdahabia(userId) {
  try {
    await paymentModel.deleteEdahabia(userId);
  } catch (error) {
    if (error?.code !== "P2025") {
      throw error;
    }
  }
}

export async function deleteCcp(userId) {
  try {
    await paymentModel.deleteCcp(userId);
  } catch (error) {
    if (error?.code !== "P2025") {
      throw error;
    }
  }
}
