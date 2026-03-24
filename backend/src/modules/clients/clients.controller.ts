import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpsertClientDto } from "./dto/upsert-client.dto";
import { ClientsService } from "./clients.service";

@UseGuards(JwtAuthGuard)
@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  async createClient(@CurrentUser() user: RequestUser, @Body() dto: UpsertClientDto) {
    return {
      success: true,
      data: await this.clientsService.upsertClient(user, dto),
    };
  }

  @Patch(":id")
  async updateClient(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() dto: UpsertClientDto,
  ) {
    return {
      success: true,
      data: await this.clientsService.upsertClient(user, { ...dto, id }),
    };
  }

  @Post("notes")
  async createNote(@CurrentUser() user: RequestUser, @Body() dto: CreateNoteDto) {
    return {
      success: true,
      data: await this.clientsService.createNote(user, dto),
    };
  }
}
