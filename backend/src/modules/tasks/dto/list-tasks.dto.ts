import { TaskPriority, TaskStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsIn, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { toOptionalInteger, toOptionalString } from "@backend/common/validation/transforms";

export const taskSortOptions = ["due-date", "created-date", "priority"] as const;
export type TaskSortOption = (typeof taskSortOptions)[number];

export class ListTasksDto {
  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: "Search must be 120 characters or fewer." })
  search?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsIn(taskSortOptions)
  sort?: TaskSortOption;

  @Transform(({ value }) => toOptionalInteger(value))
  @IsOptional()
  @Min(1)
  page?: number;

  @Transform(({ value }) => toOptionalInteger(value))
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}
