import { MeetingStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsDate, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { toOptionalString, toRequiredDate, toTrimmedString } from "@backend/common/validation/transforms";

export class UpsertMeetingDto {
  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  id?: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Meeting title is required." })
  @MaxLength(120, { message: "Meeting title must be 120 characters or fewer." })
  title!: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Description must be 500 characters or fewer." })
  description?: string;

  @IsEnum(MeetingStatus)
  status!: MeetingStatus;

  @Transform(({ value }) => toRequiredDate(value))
  @IsDate({ message: "Enter a valid date." })
  startsAt!: Date;

  @Transform(({ value }) => toRequiredDate(value))
  @IsDate({ message: "Enter a valid date." })
  endsAt!: Date;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160, { message: "Location must be 160 characters or fewer." })
  location?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(280, { message: "Meeting link must be 280 characters or fewer." })
  meetingLink?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Outcome must be 500 characters or fewer." })
  outcome?: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Client is required." })
  clientId!: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Assignee is required." })
  assignedToId!: string;
}
