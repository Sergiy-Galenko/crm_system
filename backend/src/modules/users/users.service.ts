import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { PrismaService } from "@backend/common/database/prisma.service";
import { hashPassword } from "@backend/common/next/session";
import { teamUsersWhere } from "@backend/common/scope/crm-scope";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { UpsertUserDto } from "./dto/upsert-user.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

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

    const user = dto.id
      ? await this.prisma.user.update({
          where: { id: dto.id },
          data: {
            name: dto.name,
            email: dto.email.toLowerCase(),
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
            role: dto.role,
            roleLabel: dto.roleLabel || null,
            title: dto.title || null,
            passwordHash: passwordHash!,
            createdById: currentUser.userId,
          },
        });

    await this.activityLogService.log(this.prisma, {
      actorId: currentUser.userId,
      entity: ActivityEntity.USER,
      action: dto.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
      entityId: user.id,
      description: dto.id ? `Updated user ${user.email}.` : `Invited user ${user.email}.`,
    });

    return user;
  }

  async updateSettings(currentUser: RequestUser, dto: UpdateSettingsDto) {
    await this.prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        name: dto.name,
        title: dto.title || null,
        statusMessage: dto.statusMessage || null,
        phone: dto.phone || null,
        location: dto.location || null,
        bio: dto.bio || null,
        companyLogoUrl: dto.companyLogoUrl || null,
        avatarColor: dto.avatarColor,
      },
    });

    await this.activityLogService.log(this.prisma, {
      actorId: currentUser.userId,
      entity: ActivityEntity.USER,
      action: ActivityAction.UPDATED,
      entityId: currentUser.userId,
      description: `${dto.name} updated profile settings.`,
    });
  }
}
