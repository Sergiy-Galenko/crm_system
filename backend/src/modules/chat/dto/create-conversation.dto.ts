import { Transform } from "class-transformer";
import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { toOptionalString, toTrimmedString } from "@backend/common/validation/transforms";

export class CreateConversationDto {
  @Transform(({ value }) => toTrimmedString(value).toUpperCase())
  @IsIn(["DIRECT", "GROUP"], { message: "Choose a valid conversation type." })
  type!: "DIRECT" | "GROUP";

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80, { message: "Group name must be 80 characters or fewer." })
  title?: string;

  @Transform(({ value }) => {
    const items = Array.isArray(value) ? value : [value];
    return items.map((item) => toTrimmedString(item)).filter(Boolean);
  })
  @IsArray({ message: "Choose at least one teammate." })
  @ArrayMinSize(1, { message: "Choose at least one teammate." })
  @IsString({ each: true })
  participantIds!: string[];
}
