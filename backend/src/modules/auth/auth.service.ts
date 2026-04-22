import { randomUUID } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ActivityAction, ActivityEntity, type User } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { hashPassword, verifyPassword } from "@backend/common/auth/password";
import { verifyTeamInviteToken } from "@backend/common/auth/team-invite-token.server";
import { AuthPrismaService } from "@backend/common/database/auth-prisma.service";
import { PrismaService } from "@backend/common/database/prisma.service";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authPrisma: AuthPrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private getConstraintTargets(error: unknown) {
    if (!error || typeof error !== "object") {
      return [];
    }

    const maybeMeta = "meta" in error ? error.meta : undefined;

    if (!maybeMeta || typeof maybeMeta !== "object" || !("target" in maybeMeta)) {
      return [];
    }

    const { target } = maybeMeta;

    if (Array.isArray(target)) {
      return target.map(String);
    }

    if (typeof target === "string") {
      return [target];
    }

    return [];
  }

  private throwEmailConflictIfNeeded(error: unknown): never {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const target = this.getConstraintTargets(error);

      if (target.includes("email")) {
        throw new ConflictException("An account with that email already exists.");
      }

      if (target.includes("nickname")) {
        throw new ConflictException("That nickname is already taken.");
      }
    }

    throw error;
  }

  async login(dto: LoginDto) {
    const account = await this.authPrisma.authAccount.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!account) {
      throw new UnauthorizedException("We couldn't find an account with that email.");
    }

    const isPasswordValid = await verifyPassword(dto.password, account.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Incorrect email or password.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: account.id },
    });

    if (!user) {
      throw new UnauthorizedException("We couldn't find an account with that email.");
    }

    try {
      await this.activityLogService.log(this.prisma, {
        actorId: user.id,
        entity: ActivityEntity.USER,
        action: ActivityAction.LOGIN,
        entityId: user.id,
        description: `${user.name} signed in to the CRM.`,
      });
    } catch {
      // Login should succeed even if audit logging is temporarily unavailable.
    }

    return user;
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const userId = randomUUID();

    const passwordHash = await hashPassword(dto.password);
    const invite = dto.inviteToken ? await verifyTeamInviteToken(dto.inviteToken) : null;

    if (dto.inviteToken && !invite) {
      throw new BadRequestException("This invite link is invalid or has expired.");
    }

    try {
      await this.authPrisma.authAccount.create({
        data: {
          id: userId,
          email,
          passwordHash,
        },
      });
    } catch (error) {
      this.throwEmailConflictIfNeeded(error);
    }

    try {
      const user = await this.prisma.$transaction(async (tx): Promise<User> => {
        const created = await tx.user.create({
          data: {
            id: userId,
            name: dto.name,
            email,
            nickname: dto.nickname ?? null,
            title: dto.title || null,
            createdById: invite?.inviterId ?? null,
          },
        });

        await this.activityLogService.log(tx, {
          actorId: created.id,
          entity: ActivityEntity.USER,
          action: ActivityAction.REGISTERED,
          entityId: created.id,
          description: `${created.name} created a new manager account.`,
        });

        if (invite?.inviterId) {
          await this.activityLogService.log(tx, {
            actorId: created.id,
            entity: ActivityEntity.USER,
            action: ActivityAction.UPDATED,
            entityId: invite.inviterId,
            description: `${created.name} joined your team.`,
            metadata: {
              notificationType: "TEAM_JOIN",
              joinMethod: "invite",
            },
          });
        }

        return created;
      });

      return user;
    } catch (error) {
      await this.authPrisma.authAccount.delete({ where: { id: userId } }).catch(() => undefined);
      this.throwEmailConflictIfNeeded(error);
    }
  }
}
