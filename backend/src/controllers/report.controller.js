import {
  createProductReport,
  createUserReport,
  deleteAllProductReportsByProductId,
  deleteAllUserReportsByUserId,
  deleteProductReport,
  deleteUserReport,
  listProductReports,
  listUserReports,
} from "../services/report.service.js";

export async function createUserReportController(req, res, next) {
  try {
    const report = await createUserReport(req.user.userId, req.validated.body);
    return res.status(201).json(report);
  } catch (error) {
    return next(error);
  }
}

export async function listUserReportsController(req, res, next) {
  try {
    const reports = await listUserReports(req.user.role);
    return res.json(reports);
  } catch (error) {
    return next(error);
  }
}

export async function deleteUserReportController(req, res, next) {
  try {
    const result = await deleteUserReport(req.user.role, req.validated.params.reportId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteAllUserReportsByUserIdController(req, res, next) {
  try {
    const result = await deleteAllUserReportsByUserId(req.user.role, req.validated.params.userId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function createProductReportController(req, res, next) {
  try {
    const report = await createProductReport(req.user.userId, req.validated.body);
    return res.status(201).json(report);
  } catch (error) {
    return next(error);
  }
}

export async function listProductReportsController(req, res, next) {
  try {
    const reports = await listProductReports(req.user.role);
    return res.json(reports);
  } catch (error) {
    return next(error);
  }
}

export async function deleteProductReportController(req, res, next) {
  try {
    const result = await deleteProductReport(req.user.role, req.validated.params.reportId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteAllProductReportsByProductIdController(req, res, next) {
  try {
    const result = await deleteAllProductReportsByProductId(req.user.role, req.validated.params.productId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
