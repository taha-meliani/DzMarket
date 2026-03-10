import { createConversation, getMessages, listConversations, sendMessage } from "../services/chat.service.js";

export async function createConversationController(req, res, next) {
  try {
    const conversation = await createConversation(req.user.userId, req.validated.body);
    return res.status(201).json(conversation);
  } catch (error) {
    return next(error);
  }
}

export async function listConversationsController(req, res, next) {
  try {
    const data = await listConversations(req.user.userId);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function sendMessageController(req, res, next) {
  try {
    const message = await sendMessage(
      req.user.userId,
      req.validated.params.id,
      req.validated.body.text,
    );
    return res.status(201).json(message);
  } catch (error) {
    return next(error);
  }
}

export async function listMessagesController(req, res, next) {
  try {
    const messages = await getMessages(req.user.userId, req.validated.params.id);
    return res.json(messages);
  } catch (error) {
    return next(error);
  }
}

