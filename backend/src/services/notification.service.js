import { prisma } from "../config/prisma.js";
import { orderModel } from "../models/order.model.js";

const STATUS_LABEL_AR = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "تم التأكيد",
  PROCESSING: "قيد المعالجة",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELED: "ملغى",
};

function buildOrderTitle(order) {
  const baseTitle = order?.product?.title || order?.productId || "منتج";
  if (!order?.selectedOption) return baseTitle;
  const qty = Number(order?.quantity) || 1;
  return `${baseTitle} (الخيار: ${order.selectedOption} • الكمية: ${qty})`;
}

function buildStatusMessage(order, isBuyer) {
  const statusText = STATUS_LABEL_AR[order?.status] || String(order?.status || "");
  return isBuyer ? `حالة طلبك: ${statusText}` : `حالة طلب البيع: ${statusText}`;
}

async function buildUserNotificationSeeds(userId) {
  const orders = await orderModel.listByUser(userId);
  const reviews = await orderModel.listReviewsForSeller(userId);

  const orderNotifications = orders.slice(0, 50).map((order) => {
    const isBuyer = order.buyerId === userId;
    return {
      id: `order:${order.id}`,
      type: isBuyer ? "order" : "sale",
      title: buildOrderTitle(order),
      message: buildStatusMessage(order, isBuyer),
      time: order.orderDate,
      targetPath: isBuyer ? "/purchases" : "/sales",
      data: {
        productTitle: order?.product?.title || "",
        selectedOption: order?.selectedOption || "",
        quantity: Number(order?.quantity) || 1,
        status: order?.status || "",
      },
    };
  });

  const ratingNotifications = reviews.slice(0, 50).map((review) => ({
    id: `rating:${review.id}`,
    type: "rating",
    title: `تقييم جديد (${review.stars}/5)`,
    message: `${review.order.buyer.username}${review.comment ? `: ${review.comment}` : ""}`,
    time: review.date,
    targetPath: "/profile/me?tab=reviews",
    data: {
      stars: Number(review.stars) || 0,
      buyerUsername: review?.order?.buyer?.username || "",
      comment: review.comment || "",
    },
  }));

  return [...orderNotifications, ...ratingNotifications]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 50);
}

export async function listUserNotifications(userId) {
  const notifications = await buildUserNotificationSeeds(userId);
  const keys = notifications.map((item) => item.id);

  if (keys.length === 0) return [];

  const reads = await prisma.notificationReadState.findMany({
    where: {
      userId,
      notificationKey: { in: keys },
    },
    select: { notificationKey: true },
  });

  const readSet = new Set(reads.map((entry) => entry.notificationKey));

  return notifications.map((item) => ({
    ...item,
    read: readSet.has(item.id),
  }));
}

export async function markNotificationRead(userId, notificationId) {
  await prisma.notificationReadState.upsert({
    where: {
      userId_notificationKey: {
        userId,
        notificationKey: notificationId,
      },
    },
    create: {
      userId,
      notificationKey: notificationId,
    },
    update: {
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsRead(userId) {
  const notifications = await buildUserNotificationSeeds(userId);
  if (notifications.length === 0) {
    return { updated: 0 };
  }

  await prisma.$transaction(
    notifications.map((notification) =>
      prisma.notificationReadState.upsert({
        where: {
          userId_notificationKey: {
            userId,
            notificationKey: notification.id,
          },
        },
        create: {
          userId,
          notificationKey: notification.id,
        },
        update: {
          readAt: new Date(),
        },
      }),
    ),
  );

  return { updated: notifications.length };
}
