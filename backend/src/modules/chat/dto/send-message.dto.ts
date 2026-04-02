import { Transform } from "class-transformer";
import { ChatMessageMediaType } from "@prisma/chat-client";
import { IsEnum, IsOptional, IsString, Matches, MaxLength, ValidateNested, IsArray } from "class-validator";
import { toOptionalString, toTrimmedString } from "@backend/common/validation/transforms";
import { Type } from "class-transformer";

export class CreatePollDto {
  @IsString()
  question!: string;

  @IsArray()
  @IsString({ each: true })
  options!: string[];
}

export class SendMessageDto {
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  conversationId!: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: "Messages must be 2000 characters or fewer." })
  body?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(16_000_000, { message: "Chat attachments must be 12 MB or smaller." })
  @Matches(/^data:(image|video)\/[a-zA-Z0-9.+-]+;base64,/, {
    message: "Upload a valid image or video file.",
  })
  mediaUrl?: string;

  @Transform(({ value }) => toOptionalString(value)?.toUpperCase())
  @IsOptional()
  @IsEnum(ChatMessageMediaType, { message: "Choose a valid chat attachment type." })
  mediaType?: ChatMessageMediaType;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  replyToMessageId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto;
}
