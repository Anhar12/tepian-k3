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

export interface AccessTokenPayload extends JoseJWTPayload {
  id: string;
  sessionId: string;
  email: string;
  roles: string[];
  createdAt: string;
  updatedAt: string | null;
}

export interface RefreshTokenPayload extends JoseJWTPayload {
  id: string;
  sessionId: string;
  type: "refresh";
}

export interface ResetTokenPayload {
  userId: string;
  email: string;
  type: "password-reset";
  iat?: number;
  exp?: number;
}
