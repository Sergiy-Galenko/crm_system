import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { LoginDto } from "./login.dto";

export class RegisterDto extends LoginDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  @MinLength(1, { message: "Name is required." })
  @MaxLength(120, { message: "Name must be 120 characters or fewer." })
  name!: string;

  @Transform(({ value }) => {
    const normalized = String(value ?? "").trim();
    return normalized || undefined;
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Title must be 100 characters or fewer." })
  title?: string;

  @Transform(({ value }) => {
    const normalized = String(value ?? "").trim().toLowerCase().replace(/^@+/, "");
    return normalized || undefined;
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_]{3,24}$/, { message: "Use 3-24 lowercase letters, numbers, or underscores for nicknames." })
  nickname?: string;

  @Transform(({ value }) => String(value ?? ""))
  @IsString()
  @MinLength(8, { message: "Confirm your password." })
  confirmPassword!: string;

  @Transform(({ value }) => {
    const normalized = String(value ?? "").trim();
    return normalized || undefined;
  })
  @IsOptional()
  @IsString()
  inviteToken?: string;
}
