import { Router } from "express";
import { z } from "zod";
import {
  createConversationController,
  listConversationsController,
  listMessagesController,
  sendMessageController,
} from "../controllers/chat.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const createConversationSchema = z.object({
  body: z.object({
    type: z.enum(["DIRECT", "SUPPORT"]).optional(),
    participants: z.array(z.string().min(1)).default([]),
  }),
  params: z.object({}),
  query: z.object({}),
});

const conversationIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

const sendMessageSchema = z.object({
  body: z.object({ text: z.string().min(1) }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

router.get("/conversations", authenticate, listConversationsController);
router.post("/conversations", authenticate, validate(createConversationSchema), createConversationController);
router.get("/conversations/:id/messages", authenticate, validate(conversationIdSchema), listMessagesController);
router.post("/conversations/:id/messages", authenticate, validate(sendMessageSchema), sendMessageController);

export default router;

