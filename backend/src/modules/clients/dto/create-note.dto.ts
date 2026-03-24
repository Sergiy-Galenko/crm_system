import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { toOptionalString, toTrimmedString } from "@backend/common/validation/transforms";

export class CreateNoteDto {
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(3, { message: "Enter a short note." })
  @MaxLength(1000, { message: "Note is too long." })
  body!: string;

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
