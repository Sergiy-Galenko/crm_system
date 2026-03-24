import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { SESSION_COOKIE } from "@backend/common/constants/app.constants";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { verifySessionToken } from "./session-token";

type AuthenticatedRequest = Request & {
  user?: Awaited<ReturnType<typeof verifySessionToken>>;
};

function getBearerToken(request: Request) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookieToken = request.cookies?.[SESSION_COOKIE];
    const token = cookieToken || getBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("Unauthorized.");
    }

    const session = await verifySessionToken(token);

    if (!session?.userId) {
      throw new UnauthorizedException("Unauthorized.");
    }

    request.user = session;
    return true;
  }
}
