import { TaskPriority, TaskStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { ArrayMaxSize, IsArray, IsDate, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { toOptionalString, toRequiredDate, toTrimmedString } from "@backend/common/validation/transforms";

function toTaskTags(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      source
        .map((entry) => toOptionalString(entry))
        .filter((entry): entry is string => Boolean(entry))
        .slice(0, 8),
    ),
  );
}

export class UpsertTaskDto {
  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  id?: string;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Task title is required." })
  @MaxLength(120, { message: "Task title must be 120 characters or fewer." })
  title!: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(280, { message: "Description must be 280 characters or fewer." })
  description?: string;

  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @Transform(({ value }) => toTaskTags(value))
  @IsArray()
  @ArrayMaxSize(8, { message: "Use up to 8 tags per task." })
  @IsString({ each: true })
  @MaxLength(24, { each: true, message: "Task tags must be 24 characters or fewer." })
  tags: string[] = [];

  @Transform(({ value }) => toRequiredDate(value))
  @IsDate({ message: "Enter a valid due date." })
  dueDate!: Date;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  clientId?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  leadId?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  dealId?: string;
}
