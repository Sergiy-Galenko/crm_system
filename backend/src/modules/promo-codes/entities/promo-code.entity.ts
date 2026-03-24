import type { DiscountType } from "@prisma/client";

export class PromoCodeEntity {
  id!: string;
  code!: string;
  active!: boolean;
  discountType!: DiscountType;
  discountValue!: number;
}
