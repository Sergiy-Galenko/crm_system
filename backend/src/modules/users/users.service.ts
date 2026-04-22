import { randomUUID } from "node:crypto";
import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { ActivityAction, ActivityEntity, type User } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { hashPassword } from "@backend/common/auth/password";
import { verifyTeamInviteToken } from "@backend/common/auth/team-invite-token.server";
import { AuthPrismaService } from "@backend/common/database/auth-prisma.service";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { signTeamInviteToken } from "@backend/common/auth/team-invite-token.server";
import { PrismaService } from "@backend/common/database/prisma.service";
import { JoinTeamDto } from "./dto/join-team.dto";
import { teamUsersWhere } from "@backend/common/scope/crm-scope";
import { UpdateChatAppearanceDto } from "./dto/update-chat-appearance.dto";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { UpsertUserDto } from "./dto/upsert-user.dto";

@Injectable()
export class UsersService {
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

  async upsertUser(currentUser: RequestUser, dto: UpsertUserDto) {
    const canAssignAdmin = currentUser.role === "ADMIN";

    if (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER") {
      throw new ForbiddenException("Only admins and managers can manage users.");
    }

    if (!dto.id && !dto.password) {
      throw new BadRequestException("New users require a password.");
    }

    if (!canAssignAdmin && dto.role === "ADMIN") {
      throw new BadRequestException("Managers cannot create admin accounts.");
    }

    if (dto.id && !canAssignAdmin) {
      const managedUser = await this.prisma.user.findFirst({
        where: {
          id: dto.id,
          ...teamUsersWhere({ id: currentUser.userId, role: currentUser.role }),
        },
        select: { id: true },
      });

      if (!managedUser) {
        throw new ForbiddenException("Managers can only manage users in their own team.");
      }
    }

    const passwordHash = dto.password ? await hashPassword(dto.password) : undefined;
    const email = dto.email.toLowerCase();

    if (dto.id) {
      const existingAccount = await this.authPrisma.authAccount.findUnique({
        where: { id: dto.id },
      });

      if (!existingAccount) {
        throw new BadRequestException("We couldn't find that account.");
      }

      try {
        await this.authPrisma.authAccount.update({
          where: { id: dto.id },
          data: {
            email,
            ...(passwordHash ? { passwordHash } : {}),
          },
        });
      } catch (error) {
        this.throwEmailConflictIfNeeded(error);
      }

      const updatedUser = await this.prisma.$transaction(async (tx): Promise<User> => {
          const user = await tx.user.update({
            where: { id: dto.id },
            data: {
              name: dto.name,
              email,
              nickname: dto.nickname ?? null,
              role: dto.role,
              roleLabel: dto.roleLabel || null,
              title: dto.title || null,
            },
          });

          await this.activityLogService.log(tx, {
            actorId: currentUser.userId,
            entity: ActivityEntity.USER,
            action: ActivityAction.UPDATED,
            entityId: user.id,
            description: `Updated user ${user.email}.`,
          });

          return user;
        }).catch(async (error) => {
          await this.authPrisma.authAccount.update({
            where: { id: dto.id! },
            data: {
              email: existingAccount.email,
              passwordHash: existingAccount.passwordHash,
            },
          }).catch(() => undefined);

          this.throwEmailConflictIfNeeded(error);
        });

      return updatedUser;
    }

    const userId = randomUUID();

    try {
      await this.authPrisma.authAccount.create({
        data: {
          id: userId,
          email,
          passwordHash: passwordHash!,
        },
      });
    } catch (error) {
      this.throwEmailConflictIfNeeded(error);
    }

    try {
      const newUser = await this.prisma.$transaction(async (tx): Promise<User> => {
        const user = await tx.user.create({
          data: {
            id: userId,
            name: dto.name,
            email,
            nickname: dto.nickname ?? null,
            role: dto.role,
            roleLabel: dto.roleLabel || null,
            title: dto.title || null,
            createdById: currentUser.userId,
          },
        });

        await this.activityLogService.log(tx, {
          actorId: currentUser.userId,
          entity: ActivityEntity.USER,
          action: ActivityAction.CREATED,
          entityId: user.id,
          description: `Invited user ${user.email}.`,
        });

        return user;
      });

      return newUser;
    } catch (error) {
      await this.authPrisma.authAccount.delete({ where: { id: userId } }).catch(() => undefined);
      this.throwEmailConflictIfNeeded(error);
    }
  }

  async createTeamInvite(currentUser: RequestUser) {
    if (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER") {
      throw new ForbiddenException("Only admins and managers can generate invite links.");
    }

    return signTeamInviteToken({
      inviterId: currentUser.userId,
      inviterRole: currentUser.role,
    });
  }

  private extractInviteToken(value: string) {
    try {
      const url = new URL(value);
      return url.searchParams.get("invite") || value;
    } catch {
      return value;
    }
  }

  async joinTeam(currentUser: RequestUser, dto: JoinTeamDto) {
    const currentUserRecord = await this.prisma.user.findUnique({
      where: {
        id: currentUser.userId,
      },
      select: {
        id: true,
        name: true,
        role: true,
        createdById: true,
      },
    });

    if (!currentUserRecord) {
      throw new BadRequestException("We couldn't find your account.");
    }

    if (currentUserRecord.role !== "MANAGER") {
      throw new BadRequestException("Only manager accounts can join a team.");
    }

    const managedUsersCount = await this.prisma.user.count({
      where: {
        createdById: currentUser.userId,
      },
    });

    if (managedUsersCount > 0) {
      throw new BadRequestException("Remove your teammates before joining another workspace.");
    }

    let inviterId: string | null = null;
    let joinMethod: "invite" | "nickname" | null = null;

    if (dto.inviteValue) {
      const invite = await verifyTeamInviteToken(this.extractInviteToken(dto.inviteValue));

      if (!invite) {
        throw new BadRequestException("This invite link is invalid or has expired.");
      }

      inviterId = invite.inviterId;
      joinMethod = "invite";
    } else if (dto.nickname) {
      const matchedUser = await this.prisma.user.findFirst({
        where: {
          nickname: dto.nickname,
        },
        select: {
          id: true,
          createdById: true,
        },
      });

      if (!matchedUser) {
        throw new BadRequestException("We couldn't find a teammate with that nickname.");
      }

      inviterId = matchedUser.createdById ?? matchedUser.id;
      joinMethod = "nickname";
    } else {
      throw new BadRequestException("Enter an invite link or teammate nickname.");
    }

    if (!inviterId) {
      throw new BadRequestException("We couldn't find a team to join.");
    }

    if (inviterId === currentUser.userId) {
      throw new BadRequestException("You cannot join your own workspace.");
    }

    if (currentUserRecord.createdById === inviterId) {
      throw new BadRequestException("You are already in this team.");
    }

    if (currentUserRecord.createdById && currentUserRecord.createdById !== inviterId) {
      throw new BadRequestException("Leave your current team before joining another one.");
    }

    const inviter = await this.prisma.user.findUnique({
      where: {
        id: inviterId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!inviter || (inviter.role !== "ADMIN" && inviter.role !== "MANAGER")) {
      throw new BadRequestException("We couldn't find a team to join.");
    }

    await this.prisma.user.update({
      where: {
        id: currentUser.userId,
      },
      data: {
        createdById: inviter.id,
      },
    });

    await this.activityLogService.log(this.prisma, {
      actorId: currentUser.userId,
      entity: ActivityEntity.USER,
      action: ActivityAction.UPDATED,
      entityId: inviter.id,
      description: `${currentUserRecord.name} joined your team.`,
      metadata: {
        notificationType: "TEAM_JOIN",
        joinMethod,
      },
    });
  }

  async updateSettings(currentUser: RequestUser, dto: UpdateSettingsDto) {
    try {
      await this.prisma.user.update({
        where: { id: currentUser.userId },
        data: {
          name: dto.name,
          nickname: dto.nickname ?? null,
          title: dto.title || null,
          statusMessage: dto.statusMessage || null,
          phone: dto.phone || null,
          location: dto.location || null,
          bio: dto.bio || null,
          companyLogoUrl: dto.companyLogoUrl || null,
          avatarColor: dto.avatarColor,
        },
      });
    } catch (error) {
      this.throwEmailConflictIfNeeded(error);
    }

    await this.activityLogService.log(this.prisma, {
      actorId: currentUser.userId,
      entity: ActivityEntity.USER,
      action: ActivityAction.UPDATED,
      entityId: currentUser.userId,
      description: `${dto.name} updated profile settings.`,
    });
  }

  async updateChatAppearance(currentUser: RequestUser, dto: UpdateChatAppearanceDto) {
    await this.prisma.user.update({
      where: {
        id: currentUser.userId,
      },
      data: {
        chatBackgroundType: dto.chatBackgroundType,
        chatBackgroundColor: dto.chatBackgroundType === "SOLID" ? dto.chatBackgroundColor ?? "#CBD5E1" : null,
        chatBackgroundImageUrl: dto.chatBackgroundType === "IMAGE" ? dto.chatBackgroundImageUrl ?? null : null,
      },
    });

    await this.activityLogService.log(this.prisma, {
      actorId: currentUser.userId,
      entity: ActivityEntity.USER,
      action: ActivityAction.UPDATED,
      entityId: currentUser.userId,
      description: "Updated chat appearance settings.",
    });
  }
}
