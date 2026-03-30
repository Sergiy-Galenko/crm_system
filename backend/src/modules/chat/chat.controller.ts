import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { ChatService } from "./chat.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { UpdateMessageDto } from "./dto/update-message.dto";

@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("conversations")
  async createConversation(@CurrentUser() user: RequestUser, @Body() dto: CreateConversationDto) {
    return {
      success: true,
      data: await this.chatService.createConversation(user, dto),
    };
  }

  @Post("messages")
  async sendMessage(@CurrentUser() user: RequestUser, @Body() dto: SendMessageDto) {
    return {
      success: true,
      data: await this.chatService.sendMessage(user, dto),
    };
  }

  @Patch("messages/:id")
  async updateMessage(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpdateMessageDto) {
    return {
      success: true,
      data: await this.chatService.updateMessage(user, id, dto),
    };
  }
}
