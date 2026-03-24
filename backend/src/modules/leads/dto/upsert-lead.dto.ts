import { LeadSource, LeadStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";
import { toOptionalDate, toOptionalString, toRequiredNumber, toTrimmedString } from "@backend/common/validation/transforms";

export class UpsertLeadDto {
  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  id?: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Lead name is required." })
  @MaxLength(120, { message: "Lead name must be 120 characters or fewer." })
  name!: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Company is required." })
  @MaxLength(120, { message: "Company must be 120 characters or fewer." })
  company!: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsEmail({}, { message: "Enter a valid email." })
  email!: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Phone is required." })
  @MaxLength(40, { message: "Phone must be 40 characters or fewer." })
  phone!: string;

  @IsEnum(LeadSource)
  source!: LeadSource;

  @IsEnum(LeadStatus)
  status!: LeadStatus;

  @Transform(({ value }) => toRequiredNumber(value))
  @Min(0.01, { message: "Enter a valid amount." })
  estimatedValue!: number;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Owner is required." })
  ownerId!: string;

  @Transform(({ value }) => toOptionalDate(value))
  @IsOptional()
  nextFollowUpAt?: Date;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  clientId?: string;
}
