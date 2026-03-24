import { Module } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, ActivityLogService],
  exports: [ClientsService],
})
export class ClientsModule {}
