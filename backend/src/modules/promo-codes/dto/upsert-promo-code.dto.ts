import { DiscountType } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";
import {
  toBoolean,
  toOptionalDate,
  toOptionalInteger,
  toOptionalString,
  toRequiredNumber,
  toUppercaseString,
} from "@backend/common/validation/transforms";

export class UpsertPromoCodeDto {
  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  id?: string;

  @Transform(({ value }) => toUppercaseString(value))
  @IsString()
  @MinLength(1, { message: "Code is required." })
  @MaxLength(40, { message: "Code must be 40 characters or fewer." })
  code!: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(180, { message: "Description must be 180 characters or fewer." })
  description?: string;

  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  active!: boolean;

  @Transform(({ value }) => toOptionalDate(value))
  @IsOptional()
  expiresAt?: Date;

  @Transform(({ value }) => toOptionalInteger(value))
  @IsOptional()
  @Min(1, { message: "Enter a whole number." })
  usageLimit?: number;

  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @Transform(({ value }) => toRequiredNumber(value))
  @Min(0.01, { message: "Enter a valid amount." })
  discountValue!: number;
}
