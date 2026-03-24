import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { UpsertUserDto } from "./dto/upsert-user.dto";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@CurrentUser() user: RequestUser, @Body() dto: UpsertUserDto) {
    return {
      success: true,
      data: await this.usersService.upsertUser(user, dto),
    };
  }

  @Patch(":id")
  async updateUser(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpsertUserDto) {
    return {
      success: true,
      data: await this.usersService.upsertUser(user, { ...dto, id }),
    };
  }

  @Patch("settings/profile")
  async updateSettings(@CurrentUser() user: RequestUser, @Body() dto: UpdateSettingsDto) {
    await this.usersService.updateSettings(user, dto);
    return { success: true };
  }
}
