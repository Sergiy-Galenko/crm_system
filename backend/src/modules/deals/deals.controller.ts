import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { UpsertDealDto } from "./dto/upsert-deal.dto";
import { DealsService } from "./deals.service";

@UseGuards(JwtAuthGuard)
@Controller("deals")
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  async createDeal(@CurrentUser() user: RequestUser, @Body() dto: UpsertDealDto) {
    await this.dealsService.upsertDeal(user, dto);
    return { success: true };
  }

  @Patch(":id")
  async updateDeal(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpsertDealDto) {
    await this.dealsService.upsertDeal(user, { ...dto, id });
    return { success: true };
  }
}
