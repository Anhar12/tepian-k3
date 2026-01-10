import Redis, { type RedisOptions } from "ioredis";
import {
  EventTypes,
  eventSchemas,
  type EventName,
  type EventMap,
} from "@tepian-k3/schema/event.schema";
import z from "zod";
import type { SessionUser, JWTPayload } from "@tepian-k3/types/auth.types";
import { REDIS_CHANNEL } from "@tepian-k3/constants";
import { v7 as uuidv7 } from "uuid";
import { logError, logInfo, logWarn } from "../logger";
import { env } from "../../env";

// Heartbeat interval in milliseconds (30 seconds)
const HEARTBEAT_INTERVAL = 30_000;

type FilterContext = {
  session: SessionUser;
  user: JWTPayload;
};

type SubscribeOptions = {
  /** Include events triggered by the current user (default: false) */
  includeOwnEvents?: boolean;
  /** Custom filter function for additional filtering logic */
  customFilter?: <T extends EventTypes>(
    type: T,
    payload: EventMap[T],
    context: FilterContext
  ) => boolean;
};

export type EventCallback<T extends EventName = EventName> = (
  data: EventMap[T]
) => void;

export class EventBus {
  private publisher: Redis;
  private subscriber: Redis;
  private config: RedisOptions;
  private isConnected = false;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 1000;

  constructor(config: RedisOptions) {
    this.config = config;
    this.publisher = this.createRedisClient("publisher");
    this.subscriber = this.createRedisClient("subscriber");
  }

  private createRedisClient(name: string): Redis {
    const client = new Redis({
      ...this.config,
      retryStrategy: (times) => {
        if (times > this.maxReconnectAttempts) {
          logError(
            "EventBus.createRedisClient",
            `Max reconnect attempts reached for ${name}`
          );
          return null; // Stop retrying
        }
        const delay = Math.min(times * this.reconnectDelay, 10000);
        logWarn(
          "EventBus.createRedisClient",
          `Reconnecting ${name} in ${delay}ms (attempt ${times})`
        );
        return delay;
      },
    });

    client.on("connect", () => {
      this.isConnected = true;
      logInfo("EventBus.createRedisClient", `${name} connected to Redis`);
    });

    client.on("close", () => {
      this.isConnected = false;
      logWarn("EventBus.createRedisClient", `${name} disconnected from Redis`);
    });

    client.on("error", (err) => {
      logError("EventBus.createRedisClient", `Redis ${name} error:`, {
        error: err,
      });
    });

    return client;
  }

  /**
   * Check if Redis connections are healthy
   */
  get connected(): boolean {
    return this.isConnected;
  }

  private async *createMessageIterator(
    signal?: AbortSignal
  ): AsyncIterableIterator<string> {
    // Create abort controller for cleanup
    const abortHandler = () => {
      // Signal abort - will be handled in the loop
    };

    signal?.addEventListener("abort", abortHandler, { once: true });

    try {
      while (!signal?.aborted) {
        try {
          const result = await new Promise<[string, string] | null>(
            (resolve, reject) => {
              // Check if already aborted
              if (signal?.aborted) {
                resolve(null);
                return;
              }

              const cleanup = () => {
                this.subscriber.removeListener("message", messageHandler);
                this.subscriber.removeListener("error", errorHandler);
              };

              const messageHandler = (chan: string, msg: string) => {
                cleanup();
                resolve([chan, msg]);
              };

              const errorHandler = (err: Error) => {
                cleanup();
                reject(err);
              };

              const abortListener = () => {
                cleanup();
                resolve(null);
              };

              this.subscriber.once("message", messageHandler);
              this.subscriber.once("error", errorHandler);
              signal?.addEventListener("abort", abortListener, { once: true });
            }
          );

          // Check for abort or null result
          if (!result || signal?.aborted) break;

          const [channel, message] = result;
          if (channel === REDIS_CHANNEL) {
            yield message;
          }
        } catch (error) {
          if (signal?.aborted) break;
          logError(
            "EventBus.createMessageIterator",
            "Redis subscription error:",
            { error }
          );
          // Small delay before retrying on error
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    } finally {
      signal?.removeEventListener("abort", abortHandler);
    }
  }

  private parseAndValidateEvent<T extends EventTypes>(
    message: string,
    allowedTypes: T[]
  ): { type: T; payload: EventMap[T] } | null {
    try {
      const data = JSON.parse(message) as unknown;

      const parsed = z
        .object({
          type: z.enum(EventTypes),
          payload: z.unknown(),
        })
        .parse(data);

      if (!allowedTypes.includes(parsed.type as T)) {
        logInfo(
          "EventBus.parseAndValidateEvent",
          `Skipping event of type ${parsed.type} as it's not in allowed types.`
        );
        return null;
      }

      const schema = eventSchemas[parsed.type];
      const result = schema.safeParse(parsed.payload);

      if (!result.success) {
        logError(
          "EventBus.parseAndValidateEvent",
          `Invalid payload for ${parsed.type}:`,
          result.error
        );
        return null;
      }

      return {
        type: parsed.type as T,
        payload: result.data as EventMap[T],
      };
    } catch (error) {
      logError("EventBus.parseAndValidateEvent", "Failed to parse message:", {
        error,
      });
      return null;
    }
  }

  async *subscribe<T extends EventTypes>(
    types: T[],
    context: FilterContext,
    signal?: AbortSignal,
    options: SubscribeOptions = {}
  ): AsyncIterableIterator<{ type: T; payload: EventMap[T] }> {
    const { includeOwnEvents = false, customFilter } = options;

    await this.subscriber.subscribe(REDIS_CHANNEL);
    logInfo("EventBus.subscribe", `Subscribed to events:`, {
      types,
      userId: context.user.id,
    });

    const messageIterator = this.createMessageIterator(signal);

    // Setup heartbeat interval to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (!signal?.aborted) {
        logInfo("EventBus.subscribe", "Heartbeat - connection alive", {
          userId: context.user.id,
        });
      }
    }, HEARTBEAT_INTERVAL);

    try {
      for await (const message of messageIterator) {
        const event = this.parseAndValidateEvent(message, types);
        if (!event) continue;

        const { type, payload } = event;

        // Check if should skip based on user ownership
        if (!includeOwnEvents && this.isOwnEvent(payload, context)) {
          logInfo(
            "EventBus.subscribe",
            `Skipping own event ${type} for user ${context.user.id}`
          );
          continue;
        }

        // Check if event is targeted to this user
        if (!this.isEventForUser(payload, context)) {
          continue; // Silently skip events not for this user
        }

        // Apply custom filter if provided
        if (customFilter && !customFilter(type, payload, context)) {
          logInfo(
            "EventBus.subscribe",
            `Event ${type} filtered out by custom filter`
          );
          continue;
        }

        yield { type, payload } as { type: T; payload: EventMap[T] };
      }
    } finally {
      clearInterval(heartbeatInterval);
      await this.subscriber.unsubscribe(REDIS_CHANNEL);
      logInfo("EventBus.subscribe", "Unsubscribed from events", {
        userId: context.user.id,
      });
    }
  }

  async publish<T extends EventTypes>(
    type: T,
    payload: Omit<EventMap[T], "id" | "timestamp">
  ): Promise<void> {
    const event = {
      type,
      payload: {
        ...payload,
        id: uuidv7(),
        timestamp: new Date(),
      },
    };

    const schema = eventSchemas[type];
    const result = schema.safeParse(event.payload);

    if (!result.success) {
      const error = `Invalid payload for ${type}: ${z.prettifyError(
        result.error
      )}`;
      logError("EventBus.publish", "Failed to publish event:", { error });
      throw new Error(error);
    }

    logInfo("EventBus.publish", `Publishing event:`, { event });

    await this.publisher.publish(REDIS_CHANNEL, JSON.stringify(event));
  }

  private isOwnEvent<T extends EventTypes>(
    payload: EventMap[T],
    context: FilterContext
  ): boolean {
    // Check if this event was triggered by the current user
    if ("triggeredBy" in payload && payload.triggeredBy === context.user.id) {
      return true;
    }
    return false;
  }

  private isEventForUser<T extends EventTypes>(
    payload: EventMap[T],
    context: FilterContext
  ): boolean {
    // Check if event has a target userId and matches current user
    if ("userId" in payload) {
      return payload.userId === context.user.id;
    }
    // Events without userId are broadcast to all
    return true;
  }

  async cleanup(): Promise<void> {
    await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
    logInfo("EventBus.cleanup", "Closed Redis connections");
  }
}

let eventBus: EventBus | null = null;

export function initializeEventBus(config: RedisOptions): void {
  if (eventBus) {
    logWarn(
      "initializeEventBus",
      "EventBus already initialized, skipping re-initialization"
    );
    return;
  }
  eventBus = new EventBus(config);
  logInfo("initializeEventBus", "EventBus initialized");
}

export function getEventBus(): EventBus {
  if (!eventBus) {
    logWarn(
      "getEventBus",
      "EventBus not initialized, creating with default config"
    );
    const redisConfig = {
      host: env.MEMURAI_HOST,
      port: parseInt(env.MEMURAI_PORT, 10),
      password: env.MEMURAI_PASSWORD,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
    } satisfies RedisOptions;
    eventBus = new EventBus(redisConfig);
  }
  return eventBus;
}

/**
 * Gracefully shutdown the EventBus
 * Call this during server shutdown
 */
export async function shutdownEventBus(): Promise<void> {
  if (eventBus) {
    await eventBus.cleanup();
    eventBus = null;
    logInfo("shutdownEventBus", "EventBus shutdown complete");
  }
}

/**
 * Check if EventBus is initialized and connected
 */
export function isEventBusReady(): boolean {
  return eventBus !== null && eventBus.connected;
}
