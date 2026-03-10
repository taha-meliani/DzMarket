import { Router } from "express";
import {
  listMyNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, listMyNotificationsController);
router.patch("/read-all", authenticate, markAllNotificationsReadController);
router.patch("/:id/read", authenticate, markNotificationReadController);

export default router;
