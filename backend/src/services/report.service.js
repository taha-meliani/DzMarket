import { productModel } from "../models/product.model.js";
import { reportModel } from "../models/report.model.js";
import { userModel } from "../models/user.model.js";

const USER_REPORT_TYPE_MAP = {
  fake: "FAKE",
  fraud: "FRAUD",
  abuse: "ABUSE",
  spam: "SPAM",
};

const PRODUCT_REPORT_TYPE_MAP = {
  fraud: "FRAUD",
  counterfeit: "COUNTERFEIT",
  wrong_info: "WRONG_INFO",
  abuse: "ABUSE",
  other: "OTHER",
};

function toIsoDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export async function createUserReport(reporterId, payload) {
  if (reporterId === payload.userId) {
    const err = new Error("You cannot report yourself");
    err.status = 400;
    throw err;
  }
  const targetUser = await userModel.findById(payload.userId);
  if (!targetUser) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  const report = await reportModel.createUserReport({
    reportedUserId: payload.userId,
    reporterId,
    type: USER_REPORT_TYPE_MAP[payload.type],
  });
  return {
    id: report.id,
    userId: report.reportedUserId,
    date: toIsoDate(report.createdAt),
    reporterUsername: report.reporter?.username || "",
    type: payload.type,
  };
}

export async function listUserReports(role) {
  if (role !== "ADMIN") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const rows = await reportModel.listUserReports();
  return rows.map((row) => ({
    id: row.id,
    userId: row.reportedUserId,
    date: toIsoDate(row.createdAt),
    reporterUsername: row.reporter?.username || "",
    type: String(row.type || "").toLowerCase(),
  }));
}

export async function deleteUserReport(role, reportId) {
  if (role !== "ADMIN") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  const result = await reportModel.deleteUserReportById(reportId);
  if (!result?.count) {
    const err = new Error("Report not found");
    err.status = 404;
    throw err;
  }

  return { success: true, deletedCount: result.count };
}

export async function deleteAllUserReportsByUserId(role, userId) {
  if (role !== "ADMIN") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  const result = await reportModel.deleteAllUserReportsByUserId(userId);
  return { success: true, deletedCount: result?.count || 0 };
}

export async function createProductReport(reporterId, payload) {
  const product = await productModel.getById(payload.productId, reporterId, "USER");
  if (!product) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  if (product.sellerId === reporterId) {
    const err = new Error("You cannot report your own product");
    err.status = 400;
    throw err;
  }
  const report = await reportModel.createProductReport({
    productId: payload.productId,
    reporterId,
    type: PRODUCT_REPORT_TYPE_MAP[payload.type],
  });
  return {
    id: report.id,
    productId: report.productId,
    date: toIsoDate(report.createdAt),
    reporterUsername: report.reporter?.username || "",
    type: payload.type,
  };
}

export async function listProductReports(role) {
  if (role !== "ADMIN") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const rows = await reportModel.listProductReports();
  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    date: toIsoDate(row.createdAt),
    reporterUsername: row.reporter?.username || "",
    type: String(row.type || "").toLowerCase(),
  }));
}

export async function deleteProductReport(role, reportId) {
  if (role !== "ADMIN") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  const result = await reportModel.deleteProductReportById(reportId);
  if (!result?.count) {
    const err = new Error("Report not found");
    err.status = 404;
    throw err;
  }

  return { success: true, deletedCount: result.count };
}

export async function deleteAllProductReportsByProductId(role, productId) {
  if (role !== "ADMIN") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  const result = await reportModel.deleteAllProductReportsByProductId(productId);
  return { success: true, deletedCount: result?.count || 0 };
}
