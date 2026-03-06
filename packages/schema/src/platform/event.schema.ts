import { ORDER_STATUS } from "@tepian-k3/constants";
import { z } from "zod";

export const notificationEventSchema = z.object({
  id: z.uuidv7(),
  userId: z.uuidv7(),
  orderId: z.uuidv7().nullable().optional(),
  testingId: z.uuidv7().nullable().optional(),
  documentId: z.uuidv7().nullable().optional(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  timestamp: z.iso.datetime(),
  triggeredBy: z.uuidv7().optional(), // User who triggered the event
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const orderStatusChangedEventSchema = z.object({
  orderId: z.uuidv7(),
  orderNumber: z.string(),
  userId: z.uuidv7(),
  oldStatus: z.enum(ORDER_STATUS),
  newStatus: z.enum(ORDER_STATUS),
  timestamp: z.string(),
  triggeredBy: z.uuidv7().optional(), // User who changed the status
});

export const worksheetNoteCreatedEventSchema = z.object({
  noteId: z.uuidv7(),
  worksheetId: z.uuidv7(),
  content: z.string(),
  createdBy: z.uuidv7(),
  timestamp: z.string(),
});

export const broadcastTestEventSchema = z.object({
  message: z.string(),
});

// Define all event schemas
export const eventSchemas = {
  notification: notificationEventSchema,
  orderStatusChanged: orderStatusChangedEventSchema,
  worksheetNoteCreated: worksheetNoteCreatedEventSchema,
  broadcastTest: broadcastTestEventSchema,
} as const;

export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export type OrderStatusChangedEvent = z.infer<
  typeof orderStatusChangedEventSchema
>;
export type WorksheetNoteCreatedEvent = z.infer<
  typeof worksheetNoteCreatedEventSchema
>;
export type BroadcastTestEvent = z.infer<typeof broadcastTestEventSchema>;

export type EventMap = {
  notification: NotificationEvent;
  orderStatusChanged: OrderStatusChangedEvent;
  worksheetNoteCreated: WorksheetNoteCreatedEvent;
  broadcastTest: BroadcastTestEvent;
};

export type EventName = keyof EventMap;

export enum EventTypes {
  NOTIFICATION = "notification",
  ORDER_STATUS_CHANGED = "orderStatusChanged",
  WORKSHEET_NOTE_CREATED = "worksheetNoteCreated",
  BROADCAST_TEST = "broadcastTest",
  // Add more event types as needed
}
