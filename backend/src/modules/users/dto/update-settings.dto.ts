import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { toOptionalString, toTrimmedString } from "@backend/common/validation/transforms";

export class UpdateSettingsDto {
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Name is required." })
  @MaxLength(120, { message: "Name must be 120 characters or fewer." })
  name!: string;

  @Transform(({ value }) => {
    const normalized = toOptionalString(value)?.toLowerCase().replace(/^@+/, "");
    return normalized || undefined;
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_]{3,24}$/, { message: "Use 3-24 lowercase letters, numbers, or underscores for nicknames." })
  nickname?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Title must be 100 characters or fewer." })
  title?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80, { message: "Status message must be 80 characters or fewer." })
  statusMessage?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(40, { message: "Phone must be 40 characters or fewer." })
  phone?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: "Location must be 120 characters or fewer." })
  location?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(280, { message: "Bio must be 280 characters or fewer." })
  bio?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(3_000_000, { message: "Logo image is too large." })
  @Matches(/^(https?:\/\/|\/|data:image\/[a-zA-Z0-9.+-]+;base64,)/, { message: "Use a valid logo URL or upload an image." })
  companyLogoUrl?: string;

  @Transform(({ value }) => toTrimmedString(value))
  @Matches(/^#([A-Fa-f0-9]{6})$/, { message: "Choose a valid hex color." })
  avatarColor!: string;
}
