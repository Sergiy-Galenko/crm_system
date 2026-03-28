import { Role } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { toOptionalString, toTrimmedString } from "@backend/common/validation/transforms";

export class UpsertUserDto {
  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  id?: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Name is required." })
  @MaxLength(120, { message: "Name must be 120 characters or fewer." })
  name!: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsEmail({}, { message: "Enter a valid email." })
  email!: string;

  @Transform(({ value }) => {
    const normalized = toOptionalString(value)?.toLowerCase().replace(/^@+/, "");
    return normalized || undefined;
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_]{3,24}$/, { message: "Use 3-24 lowercase letters, numbers, or underscores for nicknames." })
  nickname?: string;

  @IsEnum(Role)
  role!: Role;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: "Custom role name must be 60 characters or fewer." })
  roleLabel?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Title must be 100 characters or fewer." })
  title?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Passwords must be at least 8 characters." })
  password?: string;
}
