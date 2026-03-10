import { prisma } from "../config/prisma.js";

function buildId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const identityModel = {
  upsertPendingRequest: ({ userId, documentImage }) =>
    prisma.$executeRaw`
      INSERT INTO "IdentityVerificationRequest"
        ("id", "userId", "documentImage", "status", "createdAt", "updatedAt")
      VALUES
        (${buildId("ivr")}, ${userId}, ${documentImage}, 'PENDING', NOW(), NOW())
      ON CONFLICT ("userId")
      DO UPDATE SET
        "documentImage" = EXCLUDED."documentImage",
        "status" = 'PENDING',
        "reviewedBy" = NULL,
        "reviewedAt" = NULL,
        "updatedAt" = NOW()
    `,

  findPendingByUserId: async (userId) => {
    const rows = await prisma.$queryRaw`
      SELECT "id", "userId", "documentImage", "status", "createdAt", "updatedAt"
      FROM "IdentityVerificationRequest"
      WHERE "userId" = ${userId} AND "status" = 'PENDING'
      LIMIT 1
    `;
    return rows?.[0] || null;
  },

  listPendingRequests: () =>
    prisma.$queryRaw`
      SELECT
        r."id",
        r."userId",
        r."documentImage",
        r."status",
        r."createdAt",
        u."username",
        p."firstName",
        p."lastName",
        p."gender",
        p."birthDate"
      FROM "IdentityVerificationRequest" r
      JOIN "User" u ON u."id" = r."userId"
      LEFT JOIN "UserProfile" p ON p."userId" = u."id"
      WHERE r."status" = 'PENDING'
      ORDER BY r."createdAt" DESC
    `,

  findById: async (id) => {
    const rows = await prisma.$queryRaw`
      SELECT "id", "userId", "documentImage", "status"
      FROM "IdentityVerificationRequest"
      WHERE "id" = ${id}
      LIMIT 1
    `;
    return rows?.[0] || null;
  },

  deleteById: (id) =>
    prisma.$executeRaw`
      DELETE FROM "IdentityVerificationRequest"
      WHERE "id" = ${id}
    `,
};
