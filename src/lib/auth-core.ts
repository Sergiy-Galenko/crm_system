import { type JWTPayload, SignJWT, jwtVerify } from "jose";
import type { AppRole } from "@/lib/constants";

export type SessionPayload = JWTPayload & {
  userId: string;
  role: AppRole;
  email: string;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: Omit<SessionPayload, keyof JWTPayload>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const result = await jwtVerify<SessionPayload>(token, getSecret());
    return result.payload;
  } catch {
    return null;
  }
}
