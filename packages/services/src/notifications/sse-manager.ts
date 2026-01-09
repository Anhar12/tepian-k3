import type { EventMap, EventName } from "@tepian-k3/schema/event.schema";
import { notificationEmitter } from "./emitter";

export type SSEClient = {
  id: string;
  userId: string;
  send: (event: string, data: unknown) => void;
  close: () => void;
  createdAt: Date;
};

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private userClientMap: Map<string, Set<string>> = new Map();
  private roomClientMap: Map<string, Set<string>> = new Map();
  private clientRoomMap: Map<string, Set<string>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.setupEventListeners();
    this.startHeartbeat();
  }

  private setupEventListeners() {
    // Listen for notification events
    notificationEmitter.on("notification", (data) => {
      this.sendToUser(data.userId, "notification", data);
    });

    // Listen for order status changed events
    notificationEmitter.on("orderStatusChanged", (data) => {
      this.sendToUser(data.userId, "orderStatusChanged", data);
    });

    // // Listen for chat messages - send to room
    // notificationEmitter.on("chatMessage", (data) => {
    //   this.sendToRoom(data.roomId, "chatMessage", data);
    // });

    // // Listen for typing indicators - send to room except sender
    // notificationEmitter.on("typingIndicator", (data) => {
    //   this.sendToRoomExceptUser(
    //     data.roomId,
    //     data.userId,
    //     "typingIndicator",
    //     data
    //   );
    // });

    // // Listen for user presence updates - broadcast to all or specific users
    // notificationEmitter.on("userPresence", (data) => {
    //   // Broadcast presence to all connected clients
    //   this.broadcast("userPresence", data);
    // });

    // // Listen for chat read receipts - send to room
    // notificationEmitter.on("chatRead", (data) => {
    //   this.sendToRoom(data.roomId, "chatRead", data);
    // });
  }

  private startHeartbeat() {
    // Send heartbeat every 30 seconds to keep connections alive
    this.heartbeatInterval = setInterval(() => {
      this.broadcast("heartbeat", { timestamp: new Date().toISOString() });
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

    // Send connection established event
    this.sendToClient(clientId, "connected", {
      clientId,
      timestamp: new Date().toISOString(),
    });

    console.log(`[SSE] Client connected: ${clientId} for user: ${userId}`);
    return client;
  }

  /**
   * Remove an SSE client
   */
  removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from user-client mapping
      const userClients = this.userClientMap.get(client.userId);
      if (userClients) {
        userClients.delete(clientId);
        if (userClients.size === 0) {
          this.userClientMap.delete(client.userId);
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
      console.log(`[SSE] Client disconnected: ${clientId}`);
    }
  }

  /**
   * Join a chat room
   */
  joinRoom(clientId: string, roomId: string) {
    // Add client to room
    if (!this.roomClientMap.has(roomId)) {
      this.roomClientMap.set(roomId, new Set());
    }
    this.roomClientMap.get(roomId)!.add(clientId);

    // Track room in client's room set
    const clientRooms = this.clientRoomMap.get(clientId);
    if (clientRooms) {
      clientRooms.add(roomId);
    }

    const client = this.clients.get(clientId);
    console.log(`[SSE] Client ${clientId} joined room: ${roomId}`);

    // Notify room members
    this.sendToRoom(roomId, "roomJoined", {
      roomId,
      userId: client?.userId,
      clientId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Leave a chat room
   */
  leaveRoom(clientId: string, roomId: string) {
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

    const client = this.clients.get(clientId);
    console.log(`[SSE] Client ${clientId} left room: ${roomId}`);

    // Notify remaining room members
    this.sendToRoom(roomId, "roomLeft", {
      roomId,
      userId: client?.userId,
      clientId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send event to a specific client
   */
  private sendToClient(clientId: string, event: string, data: unknown) {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.send(event, data);
      } catch (error) {
        console.error(`[SSE] Failed to send to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Send event to all clients of a specific user
   */
  sendToUser<K extends EventName>(
    userId: string,
    event: K | string,
    data: EventMap[K] | unknown
  ) {
    const clientIds = this.userClientMap.get(userId);
    if (clientIds) {
      for (const clientId of clientIds) {
        this.sendToClient(clientId, event as string, data);
      }
    }
  }

  /**
   * Send event to all clients in a room
   */
  sendToRoom(roomId: string, event: string, data: unknown) {
    const clientIds = this.roomClientMap.get(roomId);
    if (clientIds) {
      for (const clientId of clientIds) {
        this.sendToClient(clientId, event, data);
      }
    }
  }

  /**
   * Send event to all clients in a room except a specific user
   */
  sendToRoomExceptUser(
    roomId: string,
    excludeUserId: string,
    event: string,
    data: unknown
  ) {
    const clientIds = this.roomClientMap.get(roomId);
    if (clientIds) {
      for (const clientId of clientIds) {
        const client = this.clients.get(clientId);
        if (client && client.userId !== excludeUserId) {
          this.sendToClient(clientId, event, data);
        }
      }
    }
  }

  /**
   * Send event to multiple users
   */
  sendToUsers(userIds: string[], event: string, data: unknown) {
    for (const userId of userIds) {
      this.sendToUser(userId, event, data);
    }
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: string, data: unknown) {
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, event, data);
    }
  }

  /**
   * Broadcast to all except a specific user
   */
  broadcastExceptUser(excludeUserId: string, event: string, data: unknown) {
    for (const client of this.clients.values()) {
      if (client.userId !== excludeUserId) {
        this.sendToClient(client.id, event, data);
      }
    }
  }

  /**
   * Get total client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get client count for a specific user
   */
  getUserClientCount(userId: string): number {
    return this.userClientMap.get(userId)?.size ?? 0;
  }

  /**
   * Get client count in a room
   */
  getRoomClientCount(roomId: string): number {
    return this.roomClientMap.get(roomId)?.size ?? 0;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUserIds(): string[] {
    return Array.from(this.userClientMap.keys());
  }

  /**
   * Get all user IDs in a room
   */
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

  /**
   * Check if a user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userClientMap.has(userId);
  }

  /**
   * Check if a user is in a room
   */
  isUserInRoom(userId: string, roomId: string): boolean {
    const clientIds = this.roomClientMap.get(roomId);
    if (!clientIds) return false;

    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client && client.userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get rooms a client is in
   */
  getClientRooms(clientId: string): string[] {
    return Array.from(this.clientRoomMap.get(clientId) ?? []);
  }

  /**
   * Cleanup and destroy the manager
   */
  destroy() {
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

    // Remove event listeners
    notificationEmitter.removeAllListeners();
  }
}

// Export singleton instance
export const sseManager = new SSEManager();
