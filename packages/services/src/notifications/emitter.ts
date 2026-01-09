import { TypedEventEmitter } from "@tepian-k3/utils/typed-event-emitter";
import { eventSchemas, type EventMap } from "@tepian-k3/schema/event.schema";
import { redisSSEManager } from "./redis-sse-manager";
import { sseManager } from "./sse-manager";
import type { ISSEManager } from "./types";

// Create a singleton instance of the typed event emitter
export const notificationEmitter = new TypedEventEmitter<EventMap>(
  eventSchemas
);

// Flag to determine which manager to use
let useRedis = false;

/**
 * Enable Redis mode for horizontal scaling
 */
export function enableRedisMode(): void {
  useRedis = true;
}

/**
 * Check if Redis mode is enabled
 */
export function isRedisModeEnabled(): boolean {
  return useRedis;
}

/**
 * Get the active SSE manager
 */
export function getSSEManager(): ISSEManager {
  return useRedis ? redisSSEManager : sseManager;
}

// Helper function to emit notifications
export function emitNotification(data: EventMap["notification"]) {
  notificationEmitter.emit("notification", data);
  getSSEManager().sendToUser(data.userId, "notification", data);
}

// Helper function to emit order status changed events
export function emitOrderStatusChanged(data: EventMap["orderStatusChanged"]) {
  notificationEmitter.emit("orderStatusChanged", data);
  getSSEManager().sendToUser(data.userId, "orderStatusChanged", data);
}

// // Helper function to emit chat messages
// export function emitChatMessage(data: EventMap["chatMessage"]) {
//   notificationEmitter.emit("chatMessage", data);
//   getSSEManager().sendToRoom(data.roomId, "chatMessage", data);
// }

// // Helper function to emit typing indicators
// export function emitTypingIndicator(data: EventMap["typingIndicator"]) {
//   notificationEmitter.emit("typingIndicator", data);
//   getSSEManager().sendToRoomExceptUser(
//     data.roomId,
//     data.userId,
//     "typingIndicator",
//     data
//   );
// }

// // Helper function to emit user presence updates
// export function emitUserPresence(data: EventMap["userPresence"]) {
//   notificationEmitter.emit("userPresence", data);
//   getSSEManager().broadcast("userPresence", data);
// }

// // Helper function to emit chat read receipts
// export function emitChatRead(data: EventMap["chatRead"]) {
//   notificationEmitter.emit("chatRead", data);
//   getSSEManager().sendToRoom(data.roomId, "chatRead", data);
// }
