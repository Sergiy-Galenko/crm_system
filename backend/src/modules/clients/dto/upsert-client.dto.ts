import { ClientStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";
import { toOptionalString, toRequiredNumber, toTrimmedString } from "@backend/common/validation/transforms";

export class UpsertClientDto {
  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  id?: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Contact name is required." })
  @MaxLength(120, { message: "Contact name must be 120 characters or fewer." })
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

  @IsEnum(ClientStatus)
  status!: ClientStatus;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80, { message: "Segment must be 80 characters or fewer." })
  segment?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: "Location must be 120 characters or fewer." })
  location?: string;

  @Transform(({ value }) => toRequiredNumber(value))
  @Min(0.01, { message: "Enter a valid amount." })
  monthlyValue!: number;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Owner is required." })
  ownerId!: string;
}
