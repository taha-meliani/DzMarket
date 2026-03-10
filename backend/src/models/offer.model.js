import { prisma } from "../config/prisma.js";

export const offerModel = {
  create: (data) =>
    prisma.productOffer.create({
      data,
    }),
  getById: (id) =>
    prisma.productOffer.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
  update: (id, data) =>
    prisma.productOffer.update({
      where: { id },
      data,
    }),
  getMyAcceptedForProduct: ({ buyerId, productId, selectedOption, quantity }) =>
    prisma.productOffer.findFirst({
      where: {
        buyerId,
        productId,
        selectedOption,
        quantity,
        status: "ACCEPTED",
        usedAt: null,
      },
      orderBy: { acceptedAt: "desc" },
    }),
};
