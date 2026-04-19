import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ActivityAction, ActivityEntity, Prisma, type User } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { hashPassword, verifyPassword } from "@backend/common/auth/password";
import { verifyTeamInviteToken } from "@backend/common/auth/team-invite-token.server";
import { PrismaService } from "@backend/common/database/prisma.service";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private throwEmailConflictIfNeeded(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : [];

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
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException("We couldn't find an account with that email.");
    }

    const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Incorrect email or password.");
    }

    await this.activityLogService.log(this.prisma, {
      actorId: user.id,
      entity: ActivityEntity.USER,
      action: ActivityAction.LOGIN,
      entityId: user.id,
      description: `${user.name} signed in to the CRM.`,
    });

    return user;
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("An account with that email already exists.");
    }

    const passwordHash = await hashPassword(dto.password);
    const invite = dto.inviteToken ? await verifyTeamInviteToken(dto.inviteToken) : null;

    if (dto.inviteToken && !invite) {
      throw new BadRequestException("This invite link is invalid or has expired.");
    }

    const user: User = await (async () => {
      try {
        return await this.prisma.user.create({
          data: {
            name: dto.name,
            email: dto.email.toLowerCase(),
            nickname: dto.nickname ?? null,
            passwordHash,
            title: dto.title || null,
            createdById: invite?.inviterId ?? null,
          },
        });
      } catch (error) {
        this.throwEmailConflictIfNeeded(error);
      }
    })();

    await this.activityLogService.log(this.prisma, {
      actorId: user.id,
      entity: ActivityEntity.USER,
      action: ActivityAction.REGISTERED,
      entityId: user.id,
      description: `${user.name} created a new manager account.`,
    });

    if (invite?.inviterId) {
      await this.activityLogService.log(this.prisma, {
        actorId: user.id,
        entity: ActivityEntity.USER,
        action: ActivityAction.UPDATED,
        entityId: invite.inviterId,
        description: `${user.name} joined your team.`,
        metadata: {
          notificationType: "TEAM_JOIN",
          joinMethod: "invite",
        },
      });
    }

    return user;
  }
}
