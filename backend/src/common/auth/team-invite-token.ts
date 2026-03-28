import { SignJWT, jwtVerify } from "jose";
import type { AppRole } from "@backend/common/constants/crm.constants";

const teamInviteSubject = "team-invite";
const teamInviteAudience = "register";

type TeamInvitePayload = {
  inviterId: string;
  inviterRole: AppRole;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

export async function signTeamInviteToken(payload: TeamInvitePayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setSubject(teamInviteSubject)
    .setAudience(teamInviteAudience)
    .setExpirationTime("14d")
    .sign(getSecret());
}

export async function verifyTeamInviteToken(token: string) {
  try {
    const result = await jwtVerify<TeamInvitePayload>(token, getSecret(), {
      subject: teamInviteSubject,
      audience: teamInviteAudience,
    });

    return result.payload;
  } catch {
    return null;
  }
}
