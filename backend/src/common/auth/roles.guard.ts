import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AppRole } from "@backend/common/constants/crm.constants";
import { ROLES_KEY } from "./roles.decorator";
import type { RequestUser } from "./request-user.interface";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Forbidden.");
    }

    return true;
  }
}
