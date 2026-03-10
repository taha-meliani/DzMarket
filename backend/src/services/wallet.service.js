import { walletModel } from "../models/wallet.model.js";

function asNumber(value) {
  return Number(value);
}

export async function getWallet(userId) {
  const wallet = await walletModel.getOrCreate(userId);
  const [walletTransactions, orderTransactions] = await Promise.all([
    walletModel.listTransactions(userId),
    walletModel.listOrderTransactions(userId),
  ]);

  const normalizedWalletTransactions = walletTransactions.map((item) => ({
    id: item.id,
    type: item.type === "DEPOSIT" ? "deposit" : "withdrawal",
    amount: Number(item.amount),
    productTitle: null,
    createdAt: item.createdAt,
  }));

  const normalizedOrderTransactions = orderTransactions.map((order) => {
    if (order.buyerId === userId) {
      return {
        id: `purchase:${order.id}`,
        type: "purchase",
        amount: Number(order.amount),
        productTitle: order.product?.title || "",
        createdAt: order.orderDate,
      };
    }
    const saleAmount = Math.max(0, Number(order.amount) - Number(order.shippingCost));
    return {
      id: `sale:${order.id}`,
      type: "sale",
      amount: saleAmount,
      productTitle: order.product?.title || "",
      createdAt: order.orderDate,
    };
  });

  const transactions = [...normalizedWalletTransactions, ...normalizedOrderTransactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    ...wallet,
    transactions,
  };
}

export async function addFunds(userId, amount) {
  if (amount <= 0) {
    const err = new Error("Amount must be greater than zero");
    err.status = 400;
    throw err;
  }
  const wallet = await walletModel.getOrCreate(userId);
  const next = asNumber(wallet.available) + amount;
  await walletModel.update(userId, { available: next });
  await walletModel.createTransaction({
    userId,
    type: "DEPOSIT",
    amount,
  });
  return getWallet(userId);
}

export async function withdrawFunds(userId, amount) {
  if (amount <= 0) {
    const err = new Error("Amount must be greater than zero");
    err.status = 400;
    throw err;
  }
  const paymentCcp = await walletModel.getPaymentCcp(userId);
  if (!paymentCcp) {
    const err = new Error("CCP account is required for withdrawal");
    err.status = 400;
    throw err;
  }
  const wallet = await walletModel.getOrCreate(userId);
  const available = asNumber(wallet.available);
  if (available < amount) {
    const err = new Error("Insufficient balance");
    err.status = 400;
    throw err;
  }

  await walletModel.update(userId, { available: available - amount });
  try {
    await walletModel.createTransaction({
      userId,
      type: "WITHDRAWAL",
      amount,
      ccpAccountNumber: paymentCcp.accountNumber,
      ccpSecurityKey: paymentCcp.securityKey,
      payoutStatus: "PENDING",
    });
  } catch {
    await walletModel.update(userId, { available });
    await walletModel.createWithdrawalTransactionRaw({
      userId,
      amount,
      ccpAccountNumber: paymentCcp.accountNumber,
      ccpSecurityKey: paymentCcp.securityKey,
    });
    await walletModel.update(userId, { available: available - amount });
  }

  return getWallet(userId);
}

export async function listWithdrawalRequests(role) {
  if (role !== "ADMIN") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const rows = await walletModel.listAdminWithdrawals();
  return rows.map((row) => ({
    id: row.id,
    operationAt: row.createdAt,
    username: row.username || row.user?.username || "",
    amount: Number(row.amount),
    ccpNumber: row.ccpAccountNumber || "",
    ccpKey: row.ccpSecurityKey || "",
    status: row.payoutStatus === "PAID" ? "paid" : "pending",
  }));
}

export async function markWithdrawalAsPaid(role, id) {
  if (role !== "ADMIN") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  const row = await walletModel.markWithdrawalPaid(id);
  if (!row) {
    const err = new Error("Withdrawal request not found");
    err.status = 404;
    throw err;
  }
  return {
    id: row.id,
    operationAt: row.createdAt,
    username: row.username || row.user?.username || "",
    amount: Number(row.amount),
    ccpNumber: row.ccpAccountNumber || "",
    ccpKey: row.ccpSecurityKey || "",
    status: row.payoutStatus === "PAID" ? "paid" : "pending",
  };
}
