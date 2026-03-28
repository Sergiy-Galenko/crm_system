import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { toOptionalString } from "@backend/common/validation/transforms";

export class JoinTeamDto {
  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: "Invite link is too long." })
  inviteValue?: string;

  @Transform(({ value }) => {
    const normalized = toOptionalString(value)?.toLowerCase().replace(/^@+/, "");
    return normalized || undefined;
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_]{3,24}$/, { message: "Use 3-24 lowercase letters, numbers, or underscores for nicknames." })
  nickname?: string;
}
