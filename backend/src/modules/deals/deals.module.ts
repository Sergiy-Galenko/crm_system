import { Module } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { PromoCodesModule } from "@backend/modules/promo-codes/promo-codes.module";
import { DealsController } from "./deals.controller";
import { DealsService } from "./deals.service";

@Module({
  imports: [PromoCodesModule],
  controllers: [DealsController],
  providers: [DealsService, ActivityLogService],
  exports: [DealsService],
})
export class DealsModule {}
