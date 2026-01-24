import { notifications } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { NOTIFICATION_TYPES } from "@tepian-k3/constants";

const createNotificationSchema = createInsertSchema(notifications, {
  userId: z.uuidv7(),
  type: z.enum(NOTIFICATION_TYPES).default("general"),
  title: z.string().min(1, "Title is required").max(250),
  message: z.string().min(1, "Message is required"),
  orderId: z.uuidv7().optional(),
  testingId: z.uuidv7().optional(),
  documentId: z.uuidv7().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).omit({
  id: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

const updateNotificationSchema = z.object({
  id: z.uuidv7(),
  isRead: z.boolean().optional(),
  readAt: z.coerce.date().optional(),
});

const getNotificationsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  isRead: z.boolean().optional(), // Filter by read status
  type: z.enum(NOTIFICATION_TYPES).optional(), // Filter by type
});

const markAsReadSchema = z.object({
  id: z.uuidv7(),
});

const markAllAsReadSchema = z.object({
  userId: z.uuidv7(),
});

const deleteNotificationSchema = z.object({
  id: z.uuidv7(),
});

const notificationSchema = {
  createNotificationSchema,
  updateNotificationSchema,
  getNotificationsSchema,
  markAsReadSchema,
  markAllAsReadSchema,
  deleteNotificationSchema,
};

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type MarkAllAsReadInput = z.infer<typeof markAllAsReadSchema>;
export type DeleteNotificationInput = z.infer<typeof deleteNotificationSchema>;

export default notificationSchema;
