import type { JWTPayload } from "jose";
import type { AppRole } from "@backend/common/constants/crm.constants";

export type JwtPayload = JWTPayload & {
  userId: string;
  role: AppRole;
  email: string;
};
