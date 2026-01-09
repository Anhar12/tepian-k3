import { Redis } from "ioredis";
import { v7 as uuidv7 } from "uuid";
import type { EventMap, EventName } from "@tepian-k3/schema/event.schema";
import type { PubSubMessage } from "./types";

const CHANNEL_PREFIX = "sse:";
const CHANNEL_EVENTS = `${CHANNEL_PREFIX}events`;
const CHANNEL_ROOMS = `${CHANNEL_PREFIX}rooms:`;
const CHANNEL_USERS = `${CHANNEL_PREFIX}users:`;

export type RedisConfig = {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
};

export type MessageHandler = (message: PubSubMessage) => void;

class RedisPubSub {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private serverId: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private subscribedChannels: Set<string> = new Set();
  private isConnected: boolean = false;

  constructor() {
    this.serverId = uuidv7();
  }

  /**
   * Initialize Redis connections
   */
  async connect(config: RedisConfig): Promise<void> {
    if (this.isConnected) {
      console.warn("[RedisPubSub] Already connected");
      return;
    }

    const redisOptions = {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db ?? 0,
      keyPrefix: config.keyPrefix,
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 100,
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error("[RedisPubSub] Max retries reached");
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    };

    this.publisher = new Redis(redisOptions);
    this.subscriber = new Redis(redisOptions);

    // Setup subscriber message handler
    this.subscriber.on("message", (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });

    this.subscriber.on(
      "pmessage",
      (_pattern: string, channel: string, message: string) => {
        this.handleMessage(channel, message);
      }
    );

    // Subscribe to main events channel
    await this.subscriber.subscribe(CHANNEL_EVENTS);
    this.subscribedChannels.add(CHANNEL_EVENTS);

    // Subscribe to pattern for rooms and users
    await this.subscriber.psubscribe(`${CHANNEL_ROOMS}*`);
    await this.subscriber.psubscribe(`${CHANNEL_USERS}*`);

    this.isConnected = true;
    console.log(`[RedisPubSub] Connected with server ID: ${this.serverId}`);
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.unsubscribe();
      await this.subscriber.punsubscribe();
      this.subscriber.disconnect();
      this.subscriber = null;
    }

    if (this.publisher) {
      this.publisher.disconnect();
      this.publisher = null;
    }

    this.subscribedChannels.clear();
    this.messageHandlers.clear();
    this.isConnected = false;
    console.log("[RedisPubSub] Disconnected");
  }

  /**
   * Handle incoming pub/sub message
   */
  private handleMessage(channel: string, rawMessage: string): void {
    try {
      const message = JSON.parse(rawMessage) as PubSubMessage;

      // Ignore messages from this server (we handle them locally)
      if (message.sourceServerId === this.serverId) {
        return;
      }

      // Notify all handlers
      for (const handler of this.messageHandlers) {
        try {
          handler(message);
        } catch (error) {
          console.error("[RedisPubSub] Handler error:", error);
        }
      }
    } catch (error) {
      console.error("[RedisPubSub] Failed to parse message:", error);
    }
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Publish event to a specific user (across all servers)
   */
  async publishToUser<K extends EventName>(
    userId: string,
    event: K,
    data: EventMap[K]
  ): Promise<void> {
    if (!this.publisher) {
      console.warn("[RedisPubSub] Not connected");
      return;
    }

    const message: PubSubMessage<K> = {
      event,
      data,
      targetType: "user",
      targetId: userId,
      timestamp: Date.now(),
      sourceServerId: this.serverId,
    };

    await this.publisher.publish(
      `${CHANNEL_USERS}${userId}`,
      JSON.stringify(message)
    );
  }

  /**
   * Publish event to a room (across all servers)
   */
  async publishToRoom<K extends EventName>(
    roomId: string,
    event: K,
    data: EventMap[K],
    excludeUserId?: string
  ): Promise<void> {
    if (!this.publisher) {
      console.warn("[RedisPubSub] Not connected");
      return;
    }

    const message: PubSubMessage<K> = {
      event,
      data,
      targetType: "room",
      targetId: roomId,
      excludeUserId,
      timestamp: Date.now(),
      sourceServerId: this.serverId,
    };

    await this.publisher.publish(
      `${CHANNEL_ROOMS}${roomId}`,
      JSON.stringify(message)
    );
  }

  /**
   * Broadcast event to all clients (across all servers)
   */
  async broadcast<K extends EventName>(
    event: K,
    data: EventMap[K]
  ): Promise<void> {
    if (!this.publisher) {
      console.warn("[RedisPubSub] Not connected");
      return;
    }

    const message: PubSubMessage<K> = {
      event,
      data,
      targetType: "broadcast",
      timestamp: Date.now(),
      sourceServerId: this.serverId,
    };

    await this.publisher.publish(CHANNEL_EVENTS, JSON.stringify(message));
  }

  /**
   * Store user-room mapping in Redis (for cross-server room membership)
   */
  async addUserToRoom(userId: string, roomId: string): Promise<void> {
    if (!this.publisher) return;
    await this.publisher.sadd(`room:${roomId}:users`, userId);
    await this.publisher.sadd(`user:${userId}:rooms`, roomId);
  }

  /**
   * Remove user from room in Redis
   */
  async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
    if (!this.publisher) return;
    await this.publisher.srem(`room:${roomId}:users`, userId);
    await this.publisher.srem(`user:${userId}:rooms`, roomId);
  }

  /**
   * Get all users in a room (across all servers)
   */
  async getRoomUsers(roomId: string): Promise<string[]> {
    if (!this.publisher) return [];
    return this.publisher.smembers(`room:${roomId}:users`);
  }

  /**
   * Get all rooms a user is in (across all servers)
   */
  async getUserRooms(userId: string): Promise<string[]> {
    if (!this.publisher) return [];
    return this.publisher.smembers(`user:${userId}:rooms`);
  }

  /**
   * Track online user presence
   */
  async setUserOnline(userId: string, serverId?: string): Promise<void> {
    if (!this.publisher) return;
    await this.publisher.hset(
      "online:users",
      userId,
      JSON.stringify({
        serverId: serverId ?? this.serverId,
        timestamp: Date.now(),
      })
    );
  }

  /**
   * Remove user from online tracking
   */
  async setUserOffline(userId: string): Promise<void> {
    if (!this.publisher) return;
    await this.publisher.hdel("online:users", userId);
  }

  /**
   * Check if user is online (on any server)
   */
  async isUserOnline(userId: string): Promise<boolean> {
    if (!this.publisher) return false;
    const result = await this.publisher.hget("online:users", userId);
    return result !== null;
  }

  /**
   * Get all online users
   */
  async getOnlineUsers(): Promise<string[]> {
    if (!this.publisher) return [];
    const users = await this.publisher.hkeys("online:users");
    return users;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return this.serverId;
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const redisPubSub = new RedisPubSub();
