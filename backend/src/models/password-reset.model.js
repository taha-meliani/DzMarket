import { prisma } from "../config/prisma.js";

export const passwordResetModel = {
  create: ({ userId, codeHash, expiresAt }) =>
    prisma.passwordResetRequest.create({
      data: {
        userId,
        codeHash,
        expiresAt,
      },
    }),

  getLatestActiveForUser: (userId) =>
    prisma.passwordResetRequest.findFirst({
      where: {
        userId,
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
    }),

  getById: (id) =>
    prisma.passwordResetRequest.findUnique({
      where: { id },
    }),

  incrementAttempts: (id) =>
    prisma.passwordResetRequest.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
      },
    }),

  markVerified: (id) =>
    prisma.passwordResetRequest.update({
      where: { id },
      data: {
        verifiedAt: new Date(),
      },
    }),

  consumeById: (id) =>
    prisma.passwordResetRequest.update({
      where: { id },
      data: {
        consumedAt: new Date(),
      },
    }),

  consumeAllForUser: (userId) =>
    prisma.passwordResetRequest.updateMany({
      where: {
        userId,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    }),
};
