import { prisma } from "../config/prisma.js";

export const paymentModel = {
  upsertEdahabia: (userId, data) =>
    prisma.paymentMethodEdahabia.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    }),
  upsertCcp: (userId, data) =>
    prisma.paymentMethodCCP.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    }),
  getMethods: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        paymentEdahabia: true,
        paymentCcp: true,
      },
    }),
  deleteEdahabia: (userId) =>
    prisma.paymentMethodEdahabia.delete({
      where: { userId },
    }),
  deleteCcp: (userId) =>
    prisma.paymentMethodCCP.delete({
      where: { userId },
    }),
};
