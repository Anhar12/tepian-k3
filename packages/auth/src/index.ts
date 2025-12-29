import { jwtVerify, SignJWT } from "jose";
import { env } from "../env";
import type { JWTPayload, ResetTokenPayload } from "./types/auth.types";

const secretKey = env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

const resetSecretKey = env.JWT_RESET_PASSWORD_SECRET;
const RESET_SECRET = new TextEncoder().encode(resetSecretKey);

export async function encrypt(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    // 1 month expiration
    .setExpirationTime("30d")
    .sign(key);
}

export async function decrypt(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, key);
  return payload as JWTPayload;
}

export async function encryptResetToken(
  userId: string,
  email: string
): Promise<string> {
  return await new SignJWT({ userId, email, type: "password-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m") // 30 minutes only!
    .sign(RESET_SECRET);
}

export async function decryptResetToken(
  token: string
): Promise<ResetTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, RESET_SECRET);

    // Verify it's a reset token
    if (payload.type !== "password-reset") {
      return null;
    }

    return payload as unknown as ResetTokenPayload;
  } catch (error) {
    return null;
  }
}
