import { Module } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, ActivityLogService],
  exports: [AuthService],
})
export class AuthModule {}
