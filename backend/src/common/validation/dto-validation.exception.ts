import { BadRequestException } from "@nestjs/common";

export class DtoValidationException extends BadRequestException {
  constructor(
    public readonly fields: Record<string, string>,
    message = "Please review the form.",
  ) {
    super(message);
  }
}
