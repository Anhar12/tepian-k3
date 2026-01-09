import type { EventMap, EventName } from "@tepian-k3/schema/event.schema";
import type { ISSEManager, PubSubMessage, SSEClient } from "./types";
import { redisPubSub, type RedisConfig } from "./redis-pubsub";

class RedisSSEManager implements ISSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private userClientMap: Map<string, Set<string>> = new Map();
  private roomClientMap: Map<string, Set<string>> = new Map();
  private clientRoomMap: Map<string, Set<string>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the Redis SSE Manager
   */
  async initialize(config: RedisConfig): Promise<void> {
    if (this.isInitialized) {
      console.warn("[RedisSSEManager] Already initialized");
      return;
    }

    // Connect to Redis
    await redisPubSub.connect(config);

    // Listen for messages from other servers
    redisPubSub.onMessage((message) => {
      this.handlePubSubMessage(message);
    });

    // Start heartbeat
    this.startHeartbeat();

    this.isInitialized = true;
    console.log("[RedisSSEManager] Initialized");
  }

  /**
   * Handle messages from Redis pub/sub (from other servers)
   */
  private handlePubSubMessage(message: PubSubMessage): void {
    const { event, data, targetType, targetId, excludeUserId } = message;

    switch (targetType) {
      case "user":
        if (targetId) {
          this.localSendToUser(targetId, event, data);
        }
        break;

      case "room":
        if (targetId) {
          if (excludeUserId) {
            this.localSendToRoomExceptUser(
              targetId,
              excludeUserId,
              event,
              data
            );
          } else {
            this.localSendToRoom(targetId, event, data);
          }
        }
        break;

      case "broadcast":
        this.localBroadcast(event, data);
        break;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.localBroadcast("heartbeat", { timestamp: new Date().toISOString() });
    }, 30000);
  }

  /**
   * Add a new SSE client
   */
  addClient(
    clientId: string,
    userId: string,
    send: (event: string, data: unknown) => void,
    close: () => void
  ): SSEClient {
    const client: SSEClient = {
      id: clientId,
      userId,
      send,
      close,
      createdAt: new Date(),
    };

    this.clients.set(clientId, client);

    // Add to user-client mapping
    if (!this.userClientMap.has(userId)) {
      this.userClientMap.set(userId, new Set());
    }
    this.userClientMap.get(userId)!.add(clientId);

    // Initialize client room set
    this.clientRoomMap.set(clientId, new Set());

    // Track user online in Redis
    redisPubSub.setUserOnline(userId).catch(console.error);

    // Send connection established event
    this.localSendToClient(clientId, "connected", {
      clientId,
      serverId: redisPubSub.getServerId(),
      timestamp: new Date().toISOString(),
    });

    console.log(
      `[RedisSSEManager] Client connected: ${clientId} for user: ${userId}`
    );
    return client;
  }

  /**
   * Remove an SSE client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from user-client mapping
      const userClients = this.userClientMap.get(client.userId);
      if (userClients) {
        userClients.delete(clientId);
        if (userClients.size === 0) {
          this.userClientMap.delete(client.userId);
          // User has no more connections on this server
          redisPubSub.setUserOffline(client.userId).catch(console.error);
        }
      }

      // Remove from all rooms
      const rooms = this.clientRoomMap.get(clientId);
      if (rooms) {
        for (const roomId of rooms) {
          this.leaveRoom(clientId, roomId);
        }
      }
      this.clientRoomMap.delete(clientId);

      this.clients.delete(clientId);
      console.log(`[RedisSSEManager] Client disconnected: ${clientId}`);
    }
  }

  /**
   * Join a chat room
   */
  joinRoom(clientId: string, roomId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Add to local room mapping
    if (!this.roomClientMap.has(roomId)) {
      this.roomClientMap.set(roomId, new Set());
    }
    this.roomClientMap.get(roomId)!.add(clientId);

    // Track room in client's room set
    const clientRooms = this.clientRoomMap.get(clientId);
    if (clientRooms) {
      clientRooms.add(roomId);
    }

    // Track in Redis for cross-server membership
    redisPubSub.addUserToRoom(client.userId, roomId).catch(console.error);

    console.log(`[RedisSSEManager] Client ${clientId} joined room: ${roomId}`);

    // Notify room members (local + other servers)
    this.sendToRoom(roomId, "roomJoined", {
      roomId,
      userId: client.userId,
      clientId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Leave a chat room
   */
  leaveRoom(clientId: string, roomId: string): void {
    const client = this.clients.get(clientId);

    // Remove from local mappings
    const roomClients = this.roomClientMap.get(roomId);
    if (roomClients) {
      roomClients.delete(clientId);
      if (roomClients.size === 0) {
        this.roomClientMap.delete(roomId);
      }
    }

    const clientRooms = this.clientRoomMap.get(clientId);
    if (clientRooms) {
      clientRooms.delete(roomId);
    }

    if (client) {
      // Remove from Redis
      redisPubSub
        .removeUserFromRoom(client.userId, roomId)
        .catch(console.error);

      console.log(`[RedisSSEManager] Client ${clientId} left room: ${roomId}`);

      // Notify remaining room members
      this.sendToRoom(roomId, "roomLeft", {
        roomId,
        userId: client.userId,
        clientId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ============================================
  // Local send methods (this server only)
  // ============================================

  private localSendToClient(
    clientId: string,
    event: string,
    data: unknown
  ): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.send(event, data);
      } catch (error) {
        console.error(
          `[RedisSSEManager] Failed to send to client ${clientId}:`,
          error
        );
        this.removeClient(clientId);
      }
    }
  }

  private localSendToUser(userId: string, event: string, data: unknown): void {
    const clientIds = this.userClientMap.get(userId);
    if (clientIds) {
      for (const clientId of clientIds) {
        this.localSendToClient(clientId, event, data);
      }
    }
  }

  private localSendToRoom(roomId: string, event: string, data: unknown): void {
    const clientIds = this.roomClientMap.get(roomId);
    if (clientIds) {
      for (const clientId of clientIds) {
        this.localSendToClient(clientId, event, data);
      }
    }
  }

  private localSendToRoomExceptUser(
    roomId: string,
    excludeUserId: string,
    event: string,
    data: unknown
  ): void {
    const clientIds = this.roomClientMap.get(roomId);
    if (clientIds) {
      for (const clientId of clientIds) {
        const client = this.clients.get(clientId);
        if (client && client.userId !== excludeUserId) {
          this.localSendToClient(clientId, event, data);
        }
      }
    }
  }

  private localBroadcast(event: string, data: unknown): void {
    for (const clientId of this.clients.keys()) {
      this.localSendToClient(clientId, event, data);
    }
  }

  // ============================================
  // Public send methods (local + Redis pub/sub)
  // ============================================

  /**
   * Send event to all clients of a specific user (across all servers)
   */
  sendToUser<K extends EventName>(
    userId: string,
    event: K,
    data: EventMap[K]
  ): void {
    // Send locally
    this.localSendToUser(userId, event, data);

    // Publish to Redis for other servers
    redisPubSub.publishToUser(userId, event, data).catch(console.error);
  }

  /**
   * Send event to all clients in a room (across all servers)
   */
  sendToRoom(roomId: string, event: string, data: unknown): void {
    // Send locally
    this.localSendToRoom(roomId, event, data);

    // Publish to Redis for other servers
    redisPubSub
      .publishToRoom(roomId, event as EventName, data as EventMap[EventName])
      .catch(console.error);
  }

  /**
   * Send event to all clients in a room except a specific user
   */
  sendToRoomExceptUser(
    roomId: string,
    excludeUserId: string,
    event: string,
    data: unknown
  ): void {
    // Send locally
    this.localSendToRoomExceptUser(roomId, excludeUserId, event, data);

    // Publish to Redis for other servers
    redisPubSub
      .publishToRoom(
        roomId,
        event as EventName,
        data as EventMap[EventName],
        excludeUserId
      )
      .catch(console.error);
  }

  /**
   * Broadcast event to all connected clients (across all servers)
   */
  broadcast(event: string, data: unknown): void {
    // Send locally
    this.localBroadcast(event, data);

    // Publish to Redis for other servers
    redisPubSub
      .broadcast(event as EventName, data as EventMap[EventName])
      .catch(console.error);
  }

  // ============================================
  // Utility methods
  // ============================================

  getClientCount(): number {
    return this.clients.size;
  }

  getUserClientCount(userId: string): number {
    return this.userClientMap.get(userId)?.size ?? 0;
  }

  getRoomClientCount(roomId: string): number {
    return this.roomClientMap.get(roomId)?.size ?? 0;
  }

  getConnectedUserIds(): string[] {
    return Array.from(this.userClientMap.keys());
  }

  getRoomUserIds(roomId: string): string[] {
    const clientIds = this.roomClientMap.get(roomId);
    if (!clientIds) return [];

    const userIds = new Set<string>();
    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client) {
        userIds.add(client.userId);
      }
    }
    return Array.from(userIds);
  }

  isUserConnected(userId: string): boolean {
    return this.userClientMap.has(userId);
  }

  /**
   * Check if user is online on any server
   */
  async isUserOnlineGlobally(userId: string): Promise<boolean> {
    return redisPubSub.isUserOnline(userId);
  }

  /**
   * Get all online users across all servers
   */
  async getOnlineUsersGlobally(): Promise<string[]> {
    return redisPubSub.getOnlineUsers();
  }

  /**
   * Get room users across all servers
   */
  async getRoomUsersGlobally(roomId: string): Promise<string[]> {
    return redisPubSub.getRoomUsers(roomId);
  }

  getClientRooms(clientId: string): string[] {
    return Array.from(this.clientRoomMap.get(clientId) ?? []);
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      try {
        client.close();
      } catch {
        // Ignore errors when closing
      }
    }

    this.clients.clear();
    this.userClientMap.clear();
    this.roomClientMap.clear();
    this.clientRoomMap.clear();

    // Disconnect from Redis
    redisPubSub.disconnect().catch(console.error);

    this.isInitialized = false;
    console.log("[RedisSSEManager] Destroyed");
  }
}

// Export singleton instance
export const redisSSEManager = new RedisSSEManager();
