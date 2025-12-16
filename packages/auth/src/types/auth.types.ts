import type { JWTPayload as JoseJWTPayload } from "jose";

export interface SessionUser {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface JWTPayload extends JoseJWTPayload {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string | null;
}
