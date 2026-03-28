import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { ActivityAction, ActivityEntity, Prisma, type User } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { verifyTeamInviteToken } from "@backend/common/auth/team-invite-token.server";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { signTeamInviteToken } from "@backend/common/auth/team-invite-token.server";
import { PrismaService } from "@backend/common/database/prisma.service";
import { hashPassword } from "@backend/common/next/session";
import { JoinTeamDto } from "./dto/join-team.dto";
import { teamUsersWhere } from "@backend/common/scope/crm-scope";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { UpsertUserDto } from "./dto/upsert-user.dto";

@Injectable()
export class UsersService {
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

    const user: User = await (async () => {
      try {
        return dto.id
        ? await this.prisma.user.update({
            where: { id: dto.id },
            data: {
              name: dto.name,
              email: dto.email.toLowerCase(),
              nickname: dto.nickname ?? null,
              role: dto.role,
              roleLabel: dto.roleLabel || null,
              title: dto.title || null,
              passwordHash,
            },
          })
        : await this.prisma.user.create({
            data: {
              name: dto.name,
              email: dto.email.toLowerCase(),
              nickname: dto.nickname ?? null,
              role: dto.role,
              roleLabel: dto.roleLabel || null,
              title: dto.title || null,
              passwordHash: passwordHash!,
              createdById: currentUser.userId,
            },
          });
      } catch (error) {
        this.throwEmailConflictIfNeeded(error);
      }
    })();

    await this.activityLogService.log(this.prisma, {
      actorId: currentUser.userId,
      entity: ActivityEntity.USER,
      action: dto.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
      entityId: user.id,
      description: dto.id ? `Updated user ${user.email}.` : `Invited user ${user.email}.`,
    });

    return user;
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
}
