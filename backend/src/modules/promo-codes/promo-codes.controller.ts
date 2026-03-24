import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { Roles } from "@backend/common/auth/roles.decorator";
import { RolesGuard } from "@backend/common/auth/roles.guard";
import { decimalToNumber } from "@backend/common/utils/helpers";
import { UpsertPromoCodeDto } from "./dto/upsert-promo-code.dto";
import { ValidatePromoCodeDto } from "./dto/validate-promo-code.dto";
import { PromoCodesService } from "./promo-codes.service";

@UseGuards(JwtAuthGuard)
@Controller("promo-codes")
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post()
  async createPromoCode(@CurrentUser() user: RequestUser, @Body() dto: UpsertPromoCodeDto) {
    return {
      success: true,
      data: await this.promoCodesService.upsertPromoCode(user, dto),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  async updatePromoCode(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpsertPromoCodeDto) {
    return {
      success: true,
      data: await this.promoCodesService.upsertPromoCode(user, { ...dto, id }),
    };
  }

  @Post("validate")
  async validatePromo(@CurrentUser() user: RequestUser, @Body() dto: ValidatePromoCodeDto) {
    const result = await this.promoCodesService.validatePromoCode(dto.code, dto.amount, {
      id: user.userId,
      role: user.role,
    });

    return {
      success: result.valid,
      message: result.valid ? `${result.promoCode.code} is valid and ready to apply.` : result.message,
      data: result.valid
        ? {
            code: result.promoCode.code,
            discountAmount: result.discountAmount,
            finalAmount: result.finalAmount,
            type: result.promoCode.discountType,
            value: decimalToNumber(result.promoCode.discountValue),
          }
        : undefined,
    };
  }
}
