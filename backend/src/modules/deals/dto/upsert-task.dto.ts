import { TaskPriority, TaskStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsDate, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { toOptionalString, toRequiredDate, toTrimmedString } from "@backend/common/validation/transforms";

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

  @Transform(({ value }) => toRequiredDate(value))
  @IsDate({ message: "Enter a valid due date." })
  dueDate!: Date;

  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Assignee is required." })
  assignedToId!: string;

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
