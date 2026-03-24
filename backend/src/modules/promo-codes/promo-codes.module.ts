import { Module } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { PromoCodesController } from "./promo-codes.controller";
import { PromoCodesService } from "./promo-codes.service";

@Module({
  controllers: [PromoCodesController],
  providers: [PromoCodesService, ActivityLogService],
  exports: [PromoCodesService],
})
export class PromoCodesModule {}
