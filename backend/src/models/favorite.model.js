import { prisma } from "../config/prisma.js";

export const favoriteModel = {
  exists: (userId, productId) =>
    prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    }),
  add: (userId, productId) =>
    prisma.favorite.create({
      data: { userId, productId },
    }),
  remove: (userId, productId) =>
    prisma.favorite.delete({
      where: { userId_productId: { userId, productId } },
    }),
  listForUser: (userId) =>
    prisma.favorite.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
};
