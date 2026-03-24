import { Module } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, ActivityLogService],
  exports: [LeadsService],
})
export class LeadsModule {}
