import { DealStage } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, Length, MaxLength, Min, MinLength } from "class-validator";
import { toOptionalDate, toOptionalString, toRequiredNumber, toTrimmedString, toUppercaseString } from "@backend/common/validation/transforms";

export class UpsertDealDto {
  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  id?: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Deal title is required." })
  @MaxLength(120, { message: "Deal title must be 120 characters or fewer." })
  title!: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Description must be 500 characters or fewer." })
  description?: string;

  @IsEnum(DealStage)
  stage!: DealStage;

  @Transform(({ value }) => toUppercaseString(value))
  @IsString()
  @Length(3, 3)
  currency!: string;

  @Transform(({ value }) => toRequiredNumber(value))
  @Min(0.01, { message: "Enter a valid amount." })
  grossAmount!: number;

  @Transform(({ value }) => toOptionalDate(value))
  @IsOptional()
  closeDate?: Date;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Client is required." })
  clientId!: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  leadId?: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Owner is required." })
  ownerId!: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(40, { message: "Promo code must be 40 characters or fewer." })
  promoCode?: string;
}
