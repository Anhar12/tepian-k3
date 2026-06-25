import { jwtVerify, SignJWT } from "jose";
import { env } from "../env";
import type {
  JWTPayload,
  AccessTokenPayload,
  RefreshTokenPayload,
  ResetTokenPayload,
} from "./types/auth.types";

import {
  initializeTokenBlacklist,
  isBlacklistReady,
  blacklistToken,
  isTokenBlacklisted,
  blacklistAllUserTokens,
  isTokenIssuedBeforeBlacklist,
  shutdownTokenBlacklist,
} from "@tepian-k3/services/token-blacklist";

export {
  initializeTokenBlacklist,
  isBlacklistReady,
  blacklistToken,
  isTokenBlacklisted,
  blacklistAllUserTokens,
  isTokenIssuedBeforeBlacklist,
  shutdownTokenBlacklist,
};

const secretKey = env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

const refreshSecretKey = env.JWT_REFRESH_SECRET;
const REFRESH_SECRET = new TextEncoder().encode(refreshSecretKey);

const resetSecretKey = env.JWT_RESET_PASSWORD_SECRET;
const RESET_SECRET = new TextEncoder().encode(resetSecretKey);

// New access token functions
export async function createAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TOKEN_EXPIRY)
    .sign(key);
}

export async function decryptAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, key);
  return payload as JWTPayload;
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    const accessTokenPayload = payload as AccessTokenPayload;

    // Check if token is specifically blacklisted
    if (
      accessTokenPayload.sessionId &&
      (await isTokenBlacklisted(accessTokenPayload.sessionId))
    ) {
      return null;
    }

    // Check if token was issued before a global user invalidation
    if (
      accessTokenPayload.iat &&
      (await isTokenIssuedBeforeBlacklist(
        accessTokenPayload.id,
        accessTokenPayload.iat * 1000,
      ))
    ) {
      return null;
    }

    return accessTokenPayload;
  } catch {
    return null;
  }
}

// Refresh token functions
export async function createRefreshToken(
  payload: RefreshTokenPayload,
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_SECRET);
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);

    // Verify it's a refresh token
    if (payload.type !== "refresh") {
      return null;
    }

    const refreshTokenPayload = payload as RefreshTokenPayload;

    // Check if token is specifically blacklisted
    if (
      refreshTokenPayload.sessionId &&
      (await isTokenBlacklisted(refreshTokenPayload.sessionId))
    ) {
      return null;
    }

    // Check if token was issued before a global user invalidation
    if (
      refreshTokenPayload.iat &&
      (await isTokenIssuedBeforeBlacklist(
        refreshTokenPayload.id,
        refreshTokenPayload.iat * 1000,
      ))
    ) {
      return null;
    }

    return refreshTokenPayload;
  } catch {
    return null;
  }
}

export async function encryptResetToken(
  userId: string,
  email: string,
): Promise<string> {
  return await new SignJWT({ userId, email, type: "password-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m") // 30 minutes only!
    .sign(RESET_SECRET);
}

export async function decryptResetToken(
  token: string,
): Promise<ResetTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, RESET_SECRET);

    // Verify it's a reset token
    if (payload.type !== "password-reset") {
      return null;
    }

    return payload as unknown as ResetTokenPayload;
  } catch (_error) {
    return null;
  }
}
