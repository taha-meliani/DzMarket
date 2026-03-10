import { chatModel } from "../models/chat.model.js";
import { AppError } from "../utils/app-error.js";
import { prisma } from "../config/prisma.js";

export function createConversation(currentUserId, payload) {
  const type = payload.type || "DIRECT";
  const participants = Array.from(new Set([currentUserId, ...(payload.participants || [])]));

  if (type === "SUPPORT") {
    return prisma.user
      .findUnique({
        where: { id: currentUserId },
        select: { role: true },
      })
      .then(async (currentUser) => {
        if (!currentUser) {
          throw new AppError("User not found", 404);
        }

        if (currentUser.role === "ADMIN") {
          if (participants.length >= 2) {
            return chatModel.createConversation("SUPPORT", participants);
          }
          const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
          });
          if (!admins.length) {
            throw new AppError("No support admin available", 503);
          }
          const adminsRoomParticipants = Array.from(new Set(admins.map((admin) => admin.id)));
          const existingAdminsRoom = await chatModel.findSupportConversationByParticipants(adminsRoomParticipants);
          if (existingAdminsRoom) return existingAdminsRoom;
          return chatModel.createConversation("SUPPORT", adminsRoomParticipants);
        }

        const existing = await chatModel.findSupportConversationForUser(currentUserId);
        if (existing) return existing;

        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });
        if (!admins.length) {
          throw new AppError("No support admin available", 503);
        }
        const supportParticipants = Array.from(new Set([currentUserId, ...admins.map((admin) => admin.id)]));
        return chatModel.createConversation("SUPPORT", supportParticipants);
      });
  }

  if (participants.length < 2) {
    throw new AppError("A conversation needs at least two participants", 400);
  }
  if (type === "DIRECT" && participants.length === 2) {
    return chatModel
      .findDirectConversationByParticipants(participants)
      .then((existing) => existing || chatModel.createConversation(type, participants));
  }
  return chatModel.createConversation(type, participants);
}

export async function listConversations(userId) {
  const conversations = await chatModel.listConversationsForUser(userId);
  if (!conversations.length) return [];

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = currentUser?.role === "ADMIN";

  const participantIds = Array.from(
    new Set(
      conversations
        .flatMap((conversation) => conversation.participants || [])
        .filter((id) => id && id !== userId),
    ),
  );

  const users = participantIds.length
    ? await prisma.user.findMany({
        where: { id: { in: participantIds } },
        select: {
          id: true,
          username: true,
          role: true,
          profile: { select: { avatarUrl: true } },
        },
      })
    : [];

  const usersMap = new Map(
    users.map((user) => [
      user.id,
      {
        username: user.username,
        role: user.role,
        avatarUrl: user.profile?.avatarUrl || null,
      },
    ]),
  );

  const conversationIds = conversations.map((conversation) => conversation.id);
  const messageGroups = conversationIds.length
    ? await prisma.chatMessage.groupBy({
        by: ["conversationId"],
        where: { conversationId: { in: conversationIds } },
        _count: { _all: true },
      })
    : [];
  const messageCountMap = new Map(
    messageGroups.map((group) => [group.conversationId, Number(group._count?._all || 0)]),
  );

  const visibleConversations = conversations.filter((conversation) => {
    if (conversation.type !== "SUPPORT") return true;
    return Number(messageCountMap.get(conversation.id) || 0) > 0;
  });
  if (!visibleConversations.length) return [];

  const visibleConversationIds = visibleConversations.map((conversation) => conversation.id);
  const readStates = await prisma.chatReadState.findMany({
    where: {
      userId,
      conversationId: { in: visibleConversationIds },
    },
    select: {
      conversationId: true,
      readAt: true,
    },
  });
  const readStateMap = new Map(readStates.map((state) => [state.conversationId, state.readAt]));

  const unreadCounts = await Promise.all(
    visibleConversations.map(async (conversation) => {
      const readAt = readStateMap.get(conversation.id);
      const unread = await prisma.chatMessage.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          ...(readAt ? { sentAt: { gt: readAt } } : {}),
        },
      });
      return [conversation.id, unread];
    }),
  );
  const unreadCountMap = new Map(unreadCounts);

  return visibleConversations.map((conversation) => {
    const otherParticipantId = (conversation.participants || []).find((id) => id !== userId) || null;
    const otherParticipant = otherParticipantId ? usersMap.get(otherParticipantId) : null;
    const supportUserId =
      conversation.type === "SUPPORT"
        ? (conversation.participants || []).find((id) => {
            if (id === userId) return false;
            const participant = usersMap.get(id);
            return participant?.role !== "ADMIN";
          }) || null
        : null;
    const supportUser = supportUserId ? usersMap.get(supportUserId) : null;

    return {
      ...conversation,
      unreadCount: Number(unreadCountMap.get(conversation.id) || 0),
      otherParticipantId: conversation.type === "SUPPORT" && isAdmin ? supportUserId : otherParticipantId,
      displayName:
        conversation.type === "SUPPORT"
          ? (isAdmin ? (supportUser?.username || "Support") : "Support")
          : otherParticipant?.username || otherParticipantId || "User",
      displayAvatarUrl:
        conversation.type === "SUPPORT"
          ? (isAdmin ? (supportUser?.avatarUrl || null) : null)
          : (otherParticipant?.avatarUrl || null),
    };
  });
}

export async function sendMessage(userId, conversationId, text) {
  const conversation = await chatModel.getConversation(conversationId);
  if (!conversation || !conversation.participants.includes(userId)) {
    const err = new Error("Conversation not found");
    err.status = 404;
    throw err;
  }
  return chatModel.createMessage(conversationId, userId, text);
}

export async function getMessages(userId, conversationId) {
  const conversation = await chatModel.getConversation(conversationId);
  if (!conversation || !conversation.participants.includes(userId)) {
    const err = new Error("Conversation not found");
    err.status = 404;
    throw err;
  }
  const messages = await chatModel.listMessages(conversationId);
  await chatModel.markConversationRead(conversationId, userId);
  return messages;
}
