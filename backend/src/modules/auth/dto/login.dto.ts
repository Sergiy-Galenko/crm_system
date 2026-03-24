import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @Transform(({ value }) => String(value ?? "").trim().toLowerCase())
  @IsEmail({}, { message: "Enter a valid email." })
  email!: string;

  @Transform(({ value }) => String(value ?? ""))
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters." })
  password!: string;
}
