import type { JWTPayload as JoseJWTPayload } from "jose";

export interface SessionUser {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface JWTPayload extends JoseJWTPayload {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string | null;
}
