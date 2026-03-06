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
  createdAt: string;
  updatedAt: string | null;
}

export interface ResetTokenPayload {
  userId: string;
  email: string;
  type: "password-reset";
  iat?: number;
  exp?: number;
}
