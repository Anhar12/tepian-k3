import { decryptAccessToken } from ".";
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

    const session = {
      id: payload.jti ?? crypto.randomUUID(), // JWT ID claim or generate new
      userId: payload.id,
      expiresAt: new Date((payload.exp ?? 0) * 1000),
      createdAt: new Date((payload.iat ?? 0) * 1000),
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
