import { SignJWT, jwtVerify } from "jose";
import type { JwtPayload } from "./jwt-payload.interface";

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: Omit<JwtPayload, "exp" | "iat" | "nbf" | "iss" | "sub" | "aud" | "jti">) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const result = await jwtVerify<JwtPayload>(token, getSecret());
    return result.payload;
  } catch {
    return null;
  }
}
