import { Transform } from "class-transformer";
import { ChatBackgroundType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, Matches, MaxLength, ValidateIf } from "class-validator";
import { toOptionalString } from "@backend/common/validation/transforms";

export class UpdateChatAppearanceDto {
  @Transform(({ value }) => toOptionalString(value)?.toUpperCase())
  @IsEnum(ChatBackgroundType, { message: "Choose a valid chat background." })
  chatBackgroundType!: ChatBackgroundType;

  @Transform(({ value }) => toOptionalString(value)?.toUpperCase())
  @ValidateIf((dto) => dto.chatBackgroundType === "SOLID")
  @IsString()
  @Matches(/^#([A-F0-9]{6})$/, { message: "Choose a valid background color." })
  chatBackgroundColor?: string;

  @Transform(({ value }) => toOptionalString(value))
  @ValidateIf((dto) => dto.chatBackgroundType === "IMAGE")
  @IsString()
  @MaxLength(6_000_000, { message: "Chat background image is too large." })
  @Matches(/^(https?:\/\/|\/|data:image\/[a-zA-Z0-9.+-]+;base64,)/, {
    message: "Use a valid chat background image.",
  })
  chatBackgroundImageUrl?: string;
}
