import { prisma } from "../config/prisma.js";

function buildId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const walletModel = {
  getOrCreate: (userId) =>
    prisma.wallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
  update: (userId, data) =>
    prisma.wallet.update({
      where: { userId },
      data,
    }),
  createTransaction: (data) =>
    prisma.walletTransaction.create({
      data,
    }),
  listTransactions: (userId) =>
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  listOrderTransactions: (userId) =>
    prisma.order.findMany({
      where: {
        status: { not: "CANCELED" },
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        amount: true,
        shippingCost: true,
        orderDate: true,
        product: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { orderDate: "desc" },
    }),
  getPaymentCcp: (userId) =>
    prisma.paymentMethodCCP.findUnique({
      where: { userId },
    }),
  listAdminWithdrawals: () =>
    prisma.$queryRaw`
      SELECT
        wt."id",
        wt."amount",
        wt."createdAt",
        wt."ccpAccountNumber",
        wt."ccpSecurityKey",
        wt."payoutStatus",
        wt."paidAt",
        u."username"
      FROM "WalletTransaction" wt
      JOIN "User" u ON u."id" = wt."userId"
      WHERE wt."type" = 'WITHDRAWAL'
      ORDER BY wt."createdAt" DESC
    `,
  markWithdrawalPaid: async (id) => {
    const existing = await prisma.$queryRaw`
      SELECT
        wt."id",
        wt."amount",
        wt."createdAt",
        wt."ccpAccountNumber",
        wt."ccpSecurityKey",
        wt."payoutStatus",
        wt."paidAt",
        wt."type",
        u."username"
      FROM "WalletTransaction" wt
      JOIN "User" u ON u."id" = wt."userId"
      WHERE wt."id" = ${id}
      LIMIT 1
    `;
    const tx = existing?.[0];
    if (!tx || tx.type !== "WITHDRAWAL") return null;

    if (tx.payoutStatus !== "PAID") {
      await prisma.$executeRaw`
        UPDATE "WalletTransaction"
        SET "payoutStatus" = 'PAID', "paidAt" = NOW()
        WHERE "id" = ${id}
      `;
    }

    const refreshed = await prisma.$queryRaw`
      SELECT
        wt."id",
        wt."amount",
        wt."createdAt",
        wt."ccpAccountNumber",
        wt."ccpSecurityKey",
        wt."payoutStatus",
        wt."paidAt",
        u."username"
      FROM "WalletTransaction" wt
      JOIN "User" u ON u."id" = wt."userId"
      WHERE wt."id" = ${id}
      LIMIT 1
    `;
    return refreshed?.[0] || null;
  },
  createWithdrawalTransactionRaw: ({ userId, amount, ccpAccountNumber, ccpSecurityKey }) =>
    prisma.$executeRaw`
      INSERT INTO "WalletTransaction"
        ("id", "userId", "type", "amount", "ccpAccountNumber", "ccpSecurityKey", "payoutStatus", "createdAt")
      VALUES
        (${buildId("wtx")}, ${userId}, 'WITHDRAWAL', ${amount}, ${ccpAccountNumber}, ${ccpSecurityKey}, 'PENDING', NOW())
    `,
};
