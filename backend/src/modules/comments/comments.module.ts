import { Module } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, ActivityLogService],
  exports: [CommentsService],
})
export class CommentsModule {}
