import { ORDER_STATUS } from "@tepian-k3/constants";
import { z } from "zod";

// Define schemas for each event type
export const notificationEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  orderId: z.string().uuid().nullable(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.date(),
});

export const orderStatusChangedEventSchema = z.object({
  orderId: z.uuidv7(),
  userId: z.uuidv7(),
  oldStatus: z.enum(ORDER_STATUS),
  newStatus: z.enum(ORDER_STATUS),
  timestamp: z.date(),
});

// Define all event schemas
export const eventSchemas = {
  notification: notificationEventSchema,
  orderStatusChanged: orderStatusChangedEventSchema,
} as const;

export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export type OrderStatusChangedEvent = z.infer<
  typeof orderStatusChangedEventSchema
>;

export type EventMap = {
  notification: NotificationEvent;
  orderStatusChanged: OrderStatusChangedEvent;
};

export type EventName = keyof EventMap;

export enum EventTypes {
  NOTIFICATION = "notification",
  ORDER_STATUS_CHANGED = "orderStatusChanged",
  // Add more event types as needed
}

export type EventChannel = `${EventTypes}:${string}`;

export function createChannel(type: EventTypes, userId: string): EventChannel {
  return `${type}:${userId}`;
}

export function parseChannel(
  channel: string
): { type: EventTypes; userId: string } | null {
  const [type, userId] = channel.split(":");
  if (!type || !userId) return null;

  if (!Object.values(EventTypes).includes(type as EventTypes)) {
    return null;
  }

  return { type: type as EventTypes, userId };
}
