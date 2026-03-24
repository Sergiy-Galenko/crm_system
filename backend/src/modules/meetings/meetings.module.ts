import { Module } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { MeetingsController } from "./meetings.controller";
import { MeetingsService } from "./meetings.service";

@Module({
  controllers: [MeetingsController],
  providers: [MeetingsService, ActivityLogService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
