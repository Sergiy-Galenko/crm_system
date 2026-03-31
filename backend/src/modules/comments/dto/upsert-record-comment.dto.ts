import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpsertRecordCommentDto {
  @IsOptional()
  @IsString()
  id?: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  meetingId?: string;
}
