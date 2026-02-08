import {
  decryptAccessToken,
  isTokenBlacklisted,
  isTokenIssuedBeforeBlacklist,
  isBlacklistReady,
} from ".";
import type { JWTPayload, SessionUser } from "./types/auth.types";

export async function validateToken(token: string): Promise<{
  session: SessionUser | null;
  user: JWTPayload | null;
}> {
  try {
    const payload = await decryptAccessToken(token);

    // Validate expiration
    const now = Date.now() / 1000;
    if (payload.exp && payload.exp < now) {
      return { session: null, user: null };
    }

    const jti = payload.jti ?? crypto.randomUUID();
    const userId = payload.id;
    const iat = payload.iat ?? 0;

    // Check if token is blacklisted (only if blacklist service is ready)
    if (isBlacklistReady()) {
      // Check if this specific token is blacklisted
      if (await isTokenBlacklisted(jti)) {
        return { session: null, user: null };
      }

      // Check if all user's tokens issued before a certain time are blacklisted
      if (await isTokenIssuedBeforeBlacklist(userId, iat)) {
        return { session: null, user: null };
      }
    }

    const session = {
      id: jti,
      userId,
      expiresAt: new Date((payload.exp ?? 0) * 1000),
      createdAt: new Date(iat * 1000),
    };

    const user = {
      id: payload.id,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    };

    return { session, user };
  } catch {
    return { session: null, user: null };
  }
}
