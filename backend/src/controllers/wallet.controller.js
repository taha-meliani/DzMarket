import {
  addFunds,
  getWallet,
  listWithdrawalRequests,
  markWithdrawalAsPaid,
  withdrawFunds,
} from "../services/wallet.service.js";

export async function getWalletController(req, res, next) {
  try {
    const wallet = await getWallet(req.user.userId);
    return res.json(wallet);
  } catch (error) {
    return next(error);
  }
}

export async function addFundsController(req, res, next) {
  try {
    const wallet = await addFunds(req.user.userId, req.validated.body.amount);
    return res.json(wallet);
  } catch (error) {
    return next(error);
  }
}

export async function withdrawFundsController(req, res, next) {
  try {
    const wallet = await withdrawFunds(req.user.userId, req.validated.body.amount);
    return res.json(wallet);
  } catch (error) {
    return next(error);
  }
}

export async function listWithdrawalRequestsController(req, res, next) {
  try {
    const rows = await listWithdrawalRequests(req.user.role);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

export async function markWithdrawalPaidController(req, res, next) {
  try {
    const row = await markWithdrawalAsPaid(req.user.role, req.validated.params.id);
    return res.json(row);
  } catch (error) {
    return next(error);
  }
}
