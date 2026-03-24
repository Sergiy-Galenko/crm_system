import { Module } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService, ActivityLogService],
  exports: [UsersService],
})
export class UsersModule {}
