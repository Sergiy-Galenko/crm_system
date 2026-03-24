import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { UpsertLeadDto } from "./dto/upsert-lead.dto";
import { LeadsService } from "./leads.service";

@UseGuards(JwtAuthGuard)
@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async createLead(@CurrentUser() user: RequestUser, @Body() dto: UpsertLeadDto) {
    return {
      success: true,
      data: await this.leadsService.upsertLead(user, dto),
    };
  }

  @Patch(":id")
  async updateLead(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpsertLeadDto) {
    return {
      success: true,
      data: await this.leadsService.upsertLead(user, { ...dto, id }),
    };
  }
}
