import type { EventMap, EventName } from "@tepian-k3/schema/event.schema";

export type SSEClient = {
  id: string;
  userId: string;
  send: (event: string, data: unknown) => void;
  close: () => void;
  createdAt: Date;
};

export type PubSubMessage<K extends EventName = EventName> = {
  event: K;
  data: EventMap[K];
  targetType: "user" | "room" | "broadcast";
  targetId?: string; // userId or roomId
  excludeUserId?: string; // For typing indicators
  timestamp: number;
  sourceServerId: string;
};

export type RoomJoinedMessage = {
  roomId: string;
  userId?: string;
  clientId: string;
  timestamp: string;
};

export type RoomLeftMessage = {
  roomId: string;
  userId?: string;
  clientId: string;
  timestamp: string;
};

export interface ISSEManager {
  addClient(
    clientId: string,
    userId: string,
    send: (event: string, data: unknown) => void,
    close: () => void
  ): SSEClient;
  removeClient(clientId: string): void;
  joinRoom(clientId: string, roomId: string): void;
  leaveRoom(clientId: string, roomId: string): void;
  sendToUser<K extends EventName>(
    userId: string,
    event: K,
    data: EventMap[K]
  ): void;
  sendToRoom(roomId: string, event: string, data: unknown): void;
  sendToRoomExceptUser(
    roomId: string,
    excludeUserId: string,
    event: string,
    data: unknown
  ): void;
  broadcast(event: string, data: unknown): void;
  getClientCount(): number;
  getUserClientCount(userId: string): number;
  getRoomClientCount(roomId: string): number;
  isUserConnected(userId: string): boolean;
  destroy(): void;
}
