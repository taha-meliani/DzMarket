import {
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";

export async function listMyNotificationsController(req, res, next) {
  try {
    const notifications = await listUserNotifications(req.user.userId);
    return res.json(notifications);
  } catch (error) {
    return next(error);
  }
}

export async function markNotificationReadController(req, res, next) {
  try {
    const notificationId = req.params.id;
    await markNotificationRead(req.user.userId, notificationId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function markAllNotificationsReadController(req, res, next) {
  try {
    const result = await markAllNotificationsRead(req.user.userId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
