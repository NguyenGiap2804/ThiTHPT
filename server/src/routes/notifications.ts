import { Router, Request, Response } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import {
  createNotification,
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationType,
} from "../lib/queries/notificationQueries.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized", message: "User not authenticated" });
      return;
    }

    const notifications = await getNotificationsForUser(req.user.id);
    res.status(200).json({ data: notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Internal Server Error", message: String(error) });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId = null, title, message, type = "info" } = req.body as {
      userId?: string | null;
      title?: string;
      message?: string;
      type?: NotificationType;
    };

    if (!title?.trim() || !message?.trim()) {
      res.status(400).json({ error: "Bad Request", message: "title and message are required" });
      return;
    }

    if (!["info", "success", "warning", "error"].includes(type)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid notification type" });
      return;
    }

    const notification = await createNotification({
      userId,
      title: title.trim(),
      message: message.trim(),
      type,
    });

    res.status(201).json({ data: notification });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ error: "Internal Server Error", message: String(error) });
  }
});

router.put("/:id/read", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized", message: "User not authenticated" });
      return;
    }

    const notification = await markNotificationRead(req.params.id, req.user.id);
    if (!notification) {
      res.status(404).json({ error: "Not Found", message: "Notification not found" });
      return;
    }

    res.status(200).json({ data: notification });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Internal Server Error", message: String(error) });
  }
});

router.put("/read-all", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized", message: "User not authenticated" });
      return;
    }

    await markAllNotificationsRead(req.user.id);
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ error: "Internal Server Error", message: String(error) });
  }
});

export default router;
