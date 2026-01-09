// Types
export type { SSEClient, PubSubMessage, ISSEManager } from "./types";

// Event emitter and helpers
export {
  notificationEmitter,
  emitNotification,
  emitOrderStatusChanged,
  enableRedisMode,
  isRedisModeEnabled,
  getSSEManager,
} from "./emitter";

// Local SSE manager (single server)
export { sseManager } from "./sse-manager";

// Redis SSE manager (horizontal scaling)
export { redisSSEManager } from "./redis-sse-manager";
export { redisPubSub, type RedisConfig } from "./redis-pubsub";

// Utilities
export { formatSSEMessage, getSSEHeaders, parseSSEMessage } from "./sse-utils";
