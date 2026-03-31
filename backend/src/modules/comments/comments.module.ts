import { Module } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { CommentsService } from "./comments.service";

@Module({
  providers: [CommentsService, ActivityLogService],
  exports: [CommentsService],
})
export class CommentsModule {}
