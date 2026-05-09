import { v4 as uuidv4 } from "uuid";
import { query, queryOne } from "../database.js";

export type NotificationType = "info" | "success" | "warning" | "error";

export const getNotificationsForUser = async (userId: string) => {
  return query(
    `
    SELECT
      id,
      title,
      message,
      type,
      "isRead" as read,
      "createdAt" as timestamp
    FROM "Notifications"
    WHERE "userId" = $1 OR "userId" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT 50
    `,
    [userId]
  );
};

export const createNotification = async ({
  userId = null,
  title,
  message,
  type = "info",
}: {
  userId?: string | null;
  title: string;
  message: string;
  type?: NotificationType;
}) => {
  return queryOne(
    `
    INSERT INTO "Notifications" (id, "userId", title, message, type, "isRead", "createdAt")
    VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
    RETURNING id, title, message, type, "isRead" as read, "createdAt" as timestamp
    `,
    [uuidv4(), userId, title, message, type]
  );
};

export const markNotificationRead = async (id: string, userId: string) => {
  return queryOne(
    `
    UPDATE "Notifications"
    SET "isRead" = TRUE
    WHERE id = $1 AND ("userId" = $2 OR "userId" IS NULL)
    RETURNING id, title, message, type, "isRead" as read, "createdAt" as timestamp
    `,
    [id, userId]
  );
};

export const markAllNotificationsRead = async (userId: string) => {
  await query(
    `
    UPDATE "Notifications"
    SET "isRead" = TRUE
    WHERE "userId" = $1 OR "userId" IS NULL
    `,
    [userId]
  );
};
