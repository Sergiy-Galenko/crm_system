import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { MeetingStatus } from "@prisma/client";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { UpsertMeetingDto } from "./dto/upsert-meeting.dto";
import { MeetingsService } from "./meetings.service";

@UseGuards(JwtAuthGuard)
@Controller("meetings")
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  async createMeeting(@CurrentUser() user: RequestUser, @Body() dto: UpsertMeetingDto) {
    return {
      success: true,
      data: await this.meetingsService.upsertMeeting(user, dto),
    };
  }

  @Patch(":id")
  async updateMeeting(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpsertMeetingDto) {
    return {
      success: true,
      data: await this.meetingsService.upsertMeeting(user, { ...dto, id }),
    };
  }

  @Patch(":id/status")
  async updateMeetingStatus(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body("status") status: MeetingStatus,
  ) {
    return {
      success: true,
      data: await this.meetingsService.updateMeetingStatus(user, id, status),
    };
  }

  @Delete(":id")
  async deleteMeeting(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return {
      success: true,
      data: await this.meetingsService.deleteMeeting(user, id),
    };
  }
}
