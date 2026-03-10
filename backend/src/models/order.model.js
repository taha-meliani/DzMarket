import { prisma } from "../config/prisma.js";
import { calculateShippingCost } from "../utils/shipping.js";

export const orderModel = {
  createWithWallets: async ({ buyerId, productId, selectedOption, quantity, offerId, deliveryMethod, fullName, phone, address, wilayaId, municipality }) =>
    prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          sellerId: true,
          quantity: true,
          packageSize: true,
          freeShipping: true,
          seller: { select: { isDisabled: true } },
          options: {
            where: { name: selectedOption },
            select: { id: true, name: true, price: true, quantity: true },
          },
        },
      });

      if (!product) {
        const err = new Error("Product not found");
        err.status = 404;
        throw err;
      }

      if (product.sellerId === buyerId) {
        const err = new Error("You cannot order your own product");
        err.status = 400;
        throw err;
      }
      if (product.seller?.isDisabled) {
        const err = new Error("Account is disabled. Contact support for details.");
        err.status = 403;
        throw err;
      }

      if (product.quantity < quantity) {
        const err = new Error("Product out of stock");
        err.status = 400;
        throw err;
      }

      const selectedProductOption = product.options[0];
      if (!selectedProductOption) {
        const err = new Error("Selected option not found");
        err.status = 400;
        throw err;
      }
      if (selectedProductOption.quantity < quantity) {
        const err = new Error("Selected option out of stock");
        err.status = 400;
        throw err;
      }

      const buyerWallet = await tx.wallet.upsert({
        where: { userId: buyerId },
        create: { userId: buyerId },
        update: {},
      });
      await tx.wallet.upsert({
        where: { userId: product.sellerId },
        create: { userId: product.sellerId },
        update: {},
      });

      let selectedOptionPrice = Number(selectedProductOption.price);
      let linkedOfferId = null;
      if (offerId) {
        const acceptedOffer = await tx.productOffer.findUnique({
          where: { id: offerId },
        });
        const offerMatches =
          acceptedOffer &&
          acceptedOffer.buyerId === buyerId &&
          acceptedOffer.productId === product.id &&
          acceptedOffer.selectedOption === selectedProductOption.name &&
          Number(acceptedOffer.quantity) === quantity &&
          acceptedOffer.status === "ACCEPTED" &&
          !acceptedOffer.usedAt;
        if (!offerMatches) {
          const err = new Error("Offer is invalid or already used");
          err.status = 400;
          throw err;
        }
        selectedOptionPrice = Number(acceptedOffer.acceptedPrice || acceptedOffer.offeredPrice);
        linkedOfferId = acceptedOffer.id;
      }
      const itemSubtotal = selectedOptionPrice * quantity;
      const shippingCost = calculateShippingCost({
        packageSize: product.packageSize,
        freeShipping: product.freeShipping,
      });
      const total = itemSubtotal + shippingCost;
      if (Number(buyerWallet.available) < total) {
        const err = new Error("Insufficient wallet balance");
        err.status = 400;
        throw err;
      }

      await tx.wallet.update({
        where: { userId: buyerId },
        data: { available: Number(buyerWallet.available) - total },
      });

      const sellerWallet = await tx.wallet.findUnique({ where: { userId: product.sellerId } });
      await tx.wallet.update({
        where: { userId: product.sellerId },
        data: { pending: Number(sellerWallet.pending) + itemSubtotal },
      });

      await tx.product.update({
        where: { id: product.id },
        data: { quantity: { decrement: quantity } },
      });
      await tx.productOption.update({
        where: { id: selectedProductOption.id },
        data: { quantity: { decrement: quantity } },
      });

      const createdOrder = await tx.order.create({
        data: {
          productId: product.id,
          selectedOption: selectedProductOption.name,
          quantity,
          offerId: linkedOfferId,
          buyerId,
          sellerId: product.sellerId,
          fullName,
          phone,
          address,
          wilayaId,
          municipality,
          deliveryMethod,
          amount: itemSubtotal,
          shippingCost,
        },
      });
      if (linkedOfferId) {
        await tx.productOffer.update({
          where: { id: linkedOfferId },
          data: { usedAt: new Date() },
        });
      }
      return createdOrder;
    }),
  listByUser: (userId) =>
    prisma.order.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        product: true,
        buyer: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } },
        seller: { select: { id: true, username: true } },
        review: true,
      },
      orderBy: { orderDate: "desc" },
    }),
  listAll: () =>
    prisma.order.findMany({
      include: {
        product: true,
        buyer: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } },
        seller: { select: { id: true, username: true } },
        review: true,
      },
      orderBy: { orderDate: "desc" },
    }),
  count: () => prisma.order.count(),
  getById: (id) =>
    prisma.order.findUnique({
      where: { id },
      include: { product: true, review: true },
    }),
  listReviewsForSeller: (sellerId) =>
    prisma.review.findMany({
      where: {
        order: {
          sellerId,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            sellerId: true,
            product: { select: { title: true } },
            buyer: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } },
          },
        },
      },
      orderBy: { date: "desc" },
    }),
  getSellerRatingStats: (sellerId) =>
    prisma.review.aggregate({
      where: {
        order: {
          sellerId,
        },
      },
      _avg: { stars: true },
      _count: { _all: true },
    }),
  updateSellerRating: (sellerId, rating) =>
    prisma.userProfile.upsert({
      where: { userId: sellerId },
      create: { userId: sellerId, rating },
      update: { rating },
    }),
  createReview: ({ orderId, stars, comment }) =>
    prisma.review.create({
      data: { orderId, stars, comment },
    }),
  setStatusWithSettlement: (id, status) =>
    prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) {
        const err = new Error("Order not found");
        err.status = 404;
        throw err;
      }

      if (order.status === "DELIVERED" || order.status === "CANCELED") {
        const err = new Error("Finalized orders cannot be changed");
        err.status = 400;
        throw err;
      }

      if (status === order.status) {
        return order;
      }

      if (status === "CANCELED") {
        const buyerWallet = await tx.wallet.upsert({
          where: { userId: order.buyerId },
          create: { userId: order.buyerId },
          update: {},
        });
        const sellerWallet = await tx.wallet.upsert({
          where: { userId: order.sellerId },
          create: { userId: order.sellerId },
          update: {},
        });

        const refundAmount = Number(order.amount) + Number(order.shippingCost);
        await tx.wallet.update({
          where: { userId: order.buyerId },
          data: { available: Number(buyerWallet.available) + refundAmount },
        });
        await tx.wallet.update({
          where: { userId: order.sellerId },
          data: { pending: Math.max(0, Number(sellerWallet.pending) - Number(order.amount)) },
        });
        await tx.product.update({
          where: { id: order.productId },
          data: { quantity: { increment: order.quantity || 1 } },
        });
        if (order.selectedOption) {
          await tx.productOption.updateMany({
            where: { productId: order.productId, name: order.selectedOption },
            data: { quantity: { increment: order.quantity || 1 } },
          });
        }
      }

      if (status === "DELIVERED") {
        const sellerWallet = await tx.wallet.upsert({
          where: { userId: order.sellerId },
          create: { userId: order.sellerId },
          update: {},
        });
        await tx.wallet.update({
          where: { userId: order.sellerId },
          data: {
            pending: Math.max(0, Number(sellerWallet.pending) - Number(order.amount)),
            available: Number(sellerWallet.available) + Number(order.amount),
          },
        });
      }

      return tx.order.update({
        where: { id },
        data: { status },
      });
    }),
};
