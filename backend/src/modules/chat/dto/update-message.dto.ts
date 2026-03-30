import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";
import { toTrimmedString } from "@backend/common/validation/transforms";

export class UpdateMessageDto {
  @Transform(({ value }) => toTrimmedString(value))
  @IsString()
  @MinLength(1, { message: "Message cannot be empty." })
  @MaxLength(2000, { message: "Messages must be 2000 characters or fewer." })
  body!: string;
}
