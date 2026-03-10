import { prisma } from "../config/prisma.js";

function canUseDelegate(delegate) {
  return delegate && typeof delegate.findMany === "function" && typeof delegate.create === "function";
}

function buildId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const reportModel = {
  createUserReport: async ({ reportedUserId, reporterId, type }) => {
    if (canUseDelegate(prisma.userReport)) {
      return prisma.userReport.create({
        data: {
          reportedUserId,
          reporterId,
          type,
        },
        include: {
          reporter: { select: { username: true } },
        },
      });
    }

    const id = buildId("ur");
    const rows = await prisma.$queryRaw`
      INSERT INTO "UserReport" ("id", "reportedUserId", "reporterId", "type", "createdAt")
      VALUES (${id}, ${reportedUserId}, ${reporterId}, ${type}::"UserReportType", NOW())
      RETURNING "id", "reportedUserId", "reporterId", "type", "createdAt"
    `;
    const inserted = rows?.[0];
    const reporterRows = await prisma.$queryRaw`
      SELECT "username" FROM "User" WHERE "id" = ${reporterId} LIMIT 1
    `;
    const reporterUsername = reporterRows?.[0]?.username || "";
    return {
      ...inserted,
      reporter: { username: reporterUsername },
    };
  },

  listUserReports: async () => {
    if (canUseDelegate(prisma.userReport)) {
      return prisma.userReport.findMany({
        include: {
          reporter: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const rows = await prisma.$queryRaw`
      SELECT
        r."id",
        r."reportedUserId",
        r."reporterId",
        r."type",
        r."createdAt",
        u."username" AS "reporterUsername"
      FROM "UserReport" r
      LEFT JOIN "User" u ON u."id" = r."reporterId"
      ORDER BY r."createdAt" DESC
    `;
    return rows.map((row) => ({
      id: row.id,
      reportedUserId: row.reportedUserId,
      reporterId: row.reporterId,
      type: row.type,
      createdAt: row.createdAt,
      reporter: { username: row.reporterUsername || "" },
    }));
  },

  deleteUserReportById: async (id) => {
    if (canUseDelegate(prisma.userReport)) {
      return prisma.userReport.deleteMany({
        where: { id },
      });
    }

    const deletedCount = await prisma.$executeRaw`
      DELETE FROM "UserReport"
      WHERE "id" = ${id}
    `;
    return { count: Number(deletedCount || 0) };
  },

  deleteAllUserReportsByUserId: async (reportedUserId) => {
    if (canUseDelegate(prisma.userReport)) {
      return prisma.userReport.deleteMany({
        where: { reportedUserId },
      });
    }

    const deletedCount = await prisma.$executeRaw`
      DELETE FROM "UserReport"
      WHERE "reportedUserId" = ${reportedUserId}
    `;
    return { count: Number(deletedCount || 0) };
  },

  createProductReport: async ({ productId, reporterId, type }) => {
    if (canUseDelegate(prisma.productReport)) {
      return prisma.productReport.create({
        data: {
          productId,
          reporterId,
          type,
        },
        include: {
          reporter: { select: { username: true } },
        },
      });
    }

    const id = buildId("pr");
    const rows = await prisma.$queryRaw`
      INSERT INTO "ProductReport" ("id", "productId", "reporterId", "type", "createdAt")
      VALUES (${id}, ${productId}, ${reporterId}, ${type}::"ProductReportType", NOW())
      RETURNING "id", "productId", "reporterId", "type", "createdAt"
    `;
    const inserted = rows?.[0];
    const reporterRows = await prisma.$queryRaw`
      SELECT "username" FROM "User" WHERE "id" = ${reporterId} LIMIT 1
    `;
    const reporterUsername = reporterRows?.[0]?.username || "";
    return {
      ...inserted,
      reporter: { username: reporterUsername },
    };
  },

  listProductReports: async () => {
    if (canUseDelegate(prisma.productReport)) {
      return prisma.productReport.findMany({
        include: {
          reporter: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const rows = await prisma.$queryRaw`
      SELECT
        r."id",
        r."productId",
        r."reporterId",
        r."type",
        r."createdAt",
        u."username" AS "reporterUsername"
      FROM "ProductReport" r
      LEFT JOIN "User" u ON u."id" = r."reporterId"
      ORDER BY r."createdAt" DESC
    `;
    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      reporterId: row.reporterId,
      type: row.type,
      createdAt: row.createdAt,
      reporter: { username: row.reporterUsername || "" },
    }));
  },

  deleteProductReportById: async (id) => {
    if (canUseDelegate(prisma.productReport)) {
      return prisma.productReport.deleteMany({
        where: { id },
      });
    }

    const deletedCount = await prisma.$executeRaw`
      DELETE FROM "ProductReport"
      WHERE "id" = ${id}
    `;
    return { count: Number(deletedCount || 0) };
  },

  deleteAllProductReportsByProductId: async (productId) => {
    if (canUseDelegate(prisma.productReport)) {
      return prisma.productReport.deleteMany({
        where: { productId },
      });
    }

    const deletedCount = await prisma.$executeRaw`
      DELETE FROM "ProductReport"
      WHERE "productId" = ${productId}
    `;
    return { count: Number(deletedCount || 0) };
  },
};
