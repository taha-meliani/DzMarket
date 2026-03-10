import { prisma } from "../config/prisma.js";

export const chatModel = {
  createConversation: (type, participants) =>
    prisma.chatConversation.create({
      data: {
        type,
        participants,
      },
    }),
  listConversationsForUser: (userId) =>
    prisma.chatConversation.findMany({
      where: {
        participants: { has: userId },
      },
      orderBy: { lastMessageAt: "desc" },
    }),
  findDirectConversationByParticipants: async (participants) => {
    const normalized = Array.from(new Set(participants));
    const candidates = await prisma.chatConversation.findMany({
      where: {
        type: "DIRECT",
        participants: { hasEvery: normalized },
      },
      orderBy: { createdAt: "desc" },
    });
    return (
      candidates.find((conversation) => {
        const current = conversation.participants || [];
        if (current.length !== normalized.length) return false;
        return normalized.every((participantId) => current.includes(participantId));
      }) || null
    );
  },
  findSupportConversationForUser: (userId) =>
    prisma.chatConversation.findFirst({
      where: {
        type: "SUPPORT",
        participants: { has: userId },
      },
      orderBy: { createdAt: "desc" },
    }),
  findSupportConversationByParticipants: async (participants) => {
    const normalized = Array.from(new Set(participants));
    const candidates = await prisma.chatConversation.findMany({
      where: {
        type: "SUPPORT",
        participants: { hasEvery: normalized },
      },
      orderBy: { createdAt: "desc" },
    });
    return (
      candidates.find((conversation) => {
        const current = conversation.participants || [];
        if (current.length !== normalized.length) return false;
        return normalized.every((participantId) => current.includes(participantId));
      }) || null
    );
  },
  createMessage: (conversationId, senderId, text) =>
    prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          conversationId,
          senderId,
          text,
        },
      });
      await tx.chatConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.sentAt },
      });
      return message;
    }),
  listMessages: (conversationId) =>
    prisma.chatMessage.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            username: true,
          },
        },
      },
      orderBy: { sentAt: "asc" },
    }),
  getConversation: (id) =>
    prisma.chatConversation.findUnique({
      where: { id },
    }),
  markConversationRead: (conversationId, userId) =>
    prisma.chatReadState.upsert({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      create: {
        conversationId,
        userId,
      },
      update: {
        readAt: new Date(),
      },
    }),
};
