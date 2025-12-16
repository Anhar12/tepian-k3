import { jwtVerify, SignJWT } from "jose";
import { env } from "../env";
import type { JWTPayload } from "./types/auth.types";

const secretKey = env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

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
