import { Transform } from "class-transformer";
import { IsString, Min, MinLength } from "class-validator";
import { toRequiredNumber, toTrimmedString } from "@backend/common/validation/transforms";

export class ValidatePromoCodeDto {
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Enter a promo code." })
  code!: string;

  @Transform(({ value }) => toRequiredNumber(value))
  @Min(0.01, { message: "Enter a valid amount." })
  amount!: number;
}
