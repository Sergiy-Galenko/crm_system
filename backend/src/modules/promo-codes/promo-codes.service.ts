import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { ActivityAction, ActivityEntity, DiscountType, Prisma, type PromoCodeUsage } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { PrismaService, prisma } from "@backend/common/database/prisma.service";
import { clampDiscount, decimalToNumber } from "@backend/common/utils/helpers";
import { UpsertPromoCodeDto } from "./dto/upsert-promo-code.dto";

type PromoCodeLike = {
  id: string;
  code: string;
  active: boolean;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  discountType: DiscountType;
  discountValue: Prisma.Decimal | number;
};

export type PromoValidationResult =
  | {
      valid: true;
      promoCode: PromoCodeLike;
      discountAmount: number;
      finalAmount: number;
    }
  | {
      valid: false;
      message: string;
    };

@Injectable()
export class PromoCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  calculateDiscountAmount(amount: number, discountType: DiscountType, discountValue: Prisma.Decimal | number) {
    const parsedDiscountValue = decimalToNumber(discountValue);
    const rawDiscount = discountType === DiscountType.PERCENT ? (amount * parsedDiscountValue) / 100 : parsedDiscountValue;
    return clampDiscount(amount, rawDiscount);
  }

  async validatePromoCode(
    code: string,
    amount: number,
    viewer?: { id: string; role: string },
    client: typeof prisma | Prisma.TransactionClient = prisma,
  ): Promise<PromoValidationResult> {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      return {
        valid: false,
        message: "Enter a promo code to validate it.",
      };
    }

    const promoCode = await client.promoCode.findFirst({
      where: {
        code: normalizedCode,
        ...(viewer && viewer.role !== "ADMIN" ? { createdById: viewer.id } : {}),
      },
    });

    if (!promoCode) {
      return {
        valid: false,
        message: "Promo code not found.",
      };
    }

    if (!promoCode.active) {
      return {
        valid: false,
        message: "This promo code has been disabled.",
      };
    }

    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      return {
        valid: false,
        message: "This promo code has expired.",
      };
    }

    if (promoCode.usageLimit !== null && promoCode.usedCount >= promoCode.usageLimit) {
      return {
        valid: false,
        message: "This promo code has reached its usage limit.",
      };
    }

    const discountAmount = this.calculateDiscountAmount(amount, promoCode.discountType, promoCode.discountValue);

    return {
      valid: true,
      promoCode,
      discountAmount,
      finalAmount: Math.max(0, amount - discountAmount),
    };
  }

  recalculateAppliedPromo(amount: number, usage: Pick<PromoCodeUsage, "discountType" | "discountValue">) {
    const discountAmount = this.calculateDiscountAmount(amount, usage.discountType, usage.discountValue);

    return {
      discountAmount,
      finalAmount: Math.max(0, amount - discountAmount),
    };
  }

  async upsertPromoCode(user: RequestUser, dto: UpsertPromoCodeDto) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenException("Only admins can manage promo codes.");
    }

    if (dto.discountType === DiscountType.PERCENT && dto.discountValue > 100) {
      throw new BadRequestException("Percent discounts cannot exceed 100.");
    }

    const promoCode = dto.id
      ? await this.prisma.promoCode.update({
          where: { id: dto.id },
          data: {
            code: dto.code,
            description: dto.description || null,
            active: dto.active,
            expiresAt: dto.expiresAt,
            usageLimit: dto.usageLimit,
            discountType: dto.discountType,
            discountValue: dto.discountValue,
          },
        })
      : await this.prisma.promoCode.create({
          data: {
            code: dto.code,
            description: dto.description || null,
            active: dto.active,
            expiresAt: dto.expiresAt,
            usageLimit: dto.usageLimit,
            discountType: dto.discountType,
            discountValue: dto.discountValue,
            createdById: user.userId,
          },
        });

    await this.activityLogService.log(this.prisma, {
      actorId: user.userId,
      entity: ActivityEntity.PROMO_CODE,
      action: dto.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
      entityId: promoCode.id,
      description: dto.id ? `Updated promo code ${promoCode.code}.` : `Created promo code ${promoCode.code}.`,
    });

    return promoCode;
  }
}
