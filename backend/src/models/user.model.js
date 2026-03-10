import { prisma } from "../config/prisma.js";

export const userModel = {
  create: (data) => prisma.user.create({ data }),
  list: () =>
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        adminPermissions: true,
        isDisabled: true,
        createdAt: true,
        profile: true,
        wallet: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  listAdmins: () =>
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, username: true, email: true, role: true, adminPermissions: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  countByRole: () =>
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findByPhone: (phone) =>
    prisma.user.findFirst({
      where: { phone },
    }),
  findByUsernameInsensitive: (username) =>
    prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    }),
  findById: (id) =>
    prisma.user.findUnique({
      where: { id },
      include: { profile: true, wallet: true },
    }),
  findPublicById: (id) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        adminPermissions: true,
        createdAt: true,
        profile: true,
      },
    }),
  ensureProfile: (userId) =>
    prisma.userProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
  findFollow: (followerId, followingId) =>
    prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    }),
  listFollowers: (userId) =>
    prisma.userFollow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
  listFollowing: (userId) =>
    prisma.userFollow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
  follow: async (followerId, followingId) =>
    prisma.$transaction(async (tx) => {
      await tx.userProfile.upsert({
        where: { userId: followerId },
        create: { userId: followerId },
        update: {},
      });
      await tx.userProfile.upsert({
        where: { userId: followingId },
        create: { userId: followingId },
        update: {},
      });
      await tx.userFollow.create({ data: { followerId, followingId } });
      await tx.userProfile.update({
        where: { userId: followerId },
        data: { followingCount: { increment: 1 } },
      });
      await tx.userProfile.update({
        where: { userId: followingId },
        data: { followersCount: { increment: 1 } },
      });
    }),
  unfollow: async (followerId, followingId) =>
    prisma.$transaction(async (tx) => {
      await tx.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      await tx.userProfile.updateMany({
        where: { userId: followerId, followingCount: { gt: 0 } },
        data: { followingCount: { decrement: 1 } },
      });
      await tx.userProfile.updateMany({
        where: { userId: followingId, followersCount: { gt: 0 } },
        data: { followersCount: { decrement: 1 } },
      });
    }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  updatePasswordHash: (id, passwordHash) =>
    prisma.user.update({
      where: { id },
      data: { passwordHash },
    }),
  setDisabled: (id, isDisabled) => prisma.user.update({ where: { id }, data: { isDisabled } }),
  setAdminRole: (id, adminPermissions) =>
    prisma.user.update({
      where: { id },
      data: { role: "ADMIN", adminPermissions },
      select: { id: true, username: true, email: true, role: true, adminPermissions: true },
    }),
  updateAdminPermissions: (id, adminPermissions) =>
    prisma.user.update({
      where: { id },
      data: { adminPermissions },
      select: { id: true, username: true, email: true, role: true, adminPermissions: true },
    }),
  demoteAdminToUser: (id) =>
    prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { role: "USER", adminPermissions: [] },
        select: { id: true, username: true, email: true, role: true, adminPermissions: true },
      });
      await tx.chatConversation.deleteMany({
        where: {
          type: "SUPPORT",
          participants: { has: id },
        },
      });
      return updated;
    }),
  deleteCompletely: (userId) =>
    prisma.$transaction(async (tx) => {
      await tx.chatConversation.deleteMany({
        where: {
          participants: {
            has: userId,
          },
        },
      });

      await tx.chatMessage.deleteMany({ where: { senderId: userId } });
      await tx.chatReadState.deleteMany({ where: { userId } });
      await tx.notificationReadState.deleteMany({ where: { userId } });

      await tx.userFollow.deleteMany({
        where: {
          OR: [{ followerId: userId }, { followingId: userId }],
        },
      });

      await tx.favorite.deleteMany({ where: { userId } });
      await tx.walletTransaction.deleteMany({ where: { userId } });
      await tx.paymentMethodEdahabia.deleteMany({ where: { userId } });
      await tx.paymentMethodCCP.deleteMany({ where: { userId } });

      await tx.order.deleteMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
      });

      await tx.productOffer.deleteMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
      });

      await tx.product.deleteMany({ where: { sellerId: userId } });
      await tx.userProfile.deleteMany({ where: { userId } });
      await tx.wallet.deleteMany({ where: { userId } });

      await tx.user.delete({ where: { id: userId } });
      return { id: userId };
    }),
  upsertProfile: (userId, data) =>
    prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    }),
};
