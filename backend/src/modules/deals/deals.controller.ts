import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { UpsertDealDto } from "./dto/upsert-deal.dto";
import { UpsertTaskDto } from "./dto/upsert-task.dto";
import { DealsService } from "./deals.service";

@UseGuards(JwtAuthGuard)
@Controller()
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post("deals")
  async createDeal(@CurrentUser() user: RequestUser, @Body() dto: UpsertDealDto) {
    await this.dealsService.upsertDeal(user, dto);
    return { success: true };
  }

  @Patch("deals/:id")
  async updateDeal(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpsertDealDto) {
    await this.dealsService.upsertDeal(user, { ...dto, id });
    return { success: true };
  }

  @Post("tasks")
  async createTask(@CurrentUser() user: RequestUser, @Body() dto: UpsertTaskDto) {
    return {
      success: true,
      data: await this.dealsService.upsertTask(user, dto),
    };
  }

  @Patch("tasks/:id")
  async updateTask(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpsertTaskDto) {
    return {
      success: true,
      data: await this.dealsService.upsertTask(user, { ...dto, id }),
    };
  }

  @Patch("tasks/:id/complete")
  async completeTask(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return {
      success: true,
      data: await this.dealsService.markTaskDone(user, id),
    };
  }
}
