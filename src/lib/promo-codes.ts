import "server-only";

import { DiscountType, Prisma, type PromoCodeUsage } from "@prisma/client";
import { clampDiscount, decimalToNumber } from "@/lib/utils";
import { prisma } from "@/lib/db";

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

type PromoCodeViewer = {
  id: string;
  role: string;
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

export function calculateDiscountAmount(
  amount: number,
  discountType: DiscountType,
  discountValue: Prisma.Decimal | number,
) {
  const parsedDiscountValue = decimalToNumber(discountValue);

  const rawDiscount =
    discountType === DiscountType.PERCENT ? (amount * parsedDiscountValue) / 100 : parsedDiscountValue;

  return clampDiscount(amount, rawDiscount);
}

export async function validatePromoCode(
  code: string,
  amount: number,
  viewer?: PromoCodeViewer,
): Promise<PromoValidationResult> {
  return validatePromoCodeWithClient(prisma, code, amount, viewer);
}

export async function validatePromoCodeWithClient(
  client: typeof prisma | Prisma.TransactionClient,
  code: string,
  amount: number,
  viewer?: PromoCodeViewer,
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

  const discountAmount = calculateDiscountAmount(amount, promoCode.discountType, promoCode.discountValue);

  return {
    valid: true,
    promoCode,
    discountAmount,
    finalAmount: Math.max(0, amount - discountAmount),
  };
}

export function recalculateAppliedPromo(amount: number, usage: Pick<PromoCodeUsage, "discountType" | "discountValue">) {
  const discountAmount = calculateDiscountAmount(amount, usage.discountType, usage.discountValue);

  return {
    discountAmount,
    finalAmount: Math.max(0, amount - discountAmount),
  };
}
