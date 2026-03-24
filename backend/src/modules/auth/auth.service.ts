import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { PrismaService } from "@backend/common/database/prisma.service";
import { hashPassword, verifyPassword } from "@backend/common/next/session";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

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

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        title: dto.title || null,
      },
    });

    await this.activityLogService.log(this.prisma, {
      actorId: user.id,
      entity: ActivityEntity.USER,
      action: ActivityAction.REGISTERED,
      entityId: user.id,
      description: `${user.name} created a new manager account.`,
    });

    return user;
  }
}
